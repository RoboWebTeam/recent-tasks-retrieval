import os
import sys
import json
import uuid
import secrets
import bcrypt
import psycopg2
import urllib.request
import urllib.parse
from datetime import datetime, timedelta


def new_session_id() -> str:
    """Криптостойкий сессионный токен (256 бит энтропии) — надёжнее uuid4 для токенов доступа."""
    return secrets.token_urlsafe(32)

SCHEMA = None

# Лимиты тарифов — единый источник в backend/_shared/plans.py (общий с generate-site и webhook,
# чтобы значения не расходились). Путь до backend/ ищем «вверх» до папки с _shared (работает на
# любой вложенности функции); server.py кладёт в путь только саму папку функции.
_bd = os.path.dirname(os.path.abspath(__file__))
while _bd != os.path.dirname(_bd) and not os.path.isdir(os.path.join(_bd, '_shared')):
    _bd = os.path.dirname(_bd)
if _bd not in sys.path:
    sys.path.insert(0, _bd)
from _shared.plans import PLAN_LIMITS  # noqa: E402

# Стартовый бонус энергии для новых пользователей — чтобы можно было протестировать
# AI-редактор чуть дольше, чем базовый лимит тарифа Free
STARTER_ENERGY = 10

def get_schema():
    global SCHEMA
    if not SCHEMA:
        SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return SCHEMA

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_id_by_session(cur, schema: str, session_id: str):
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def reset_requests_if_needed(cur, schema: str, user_id: int, plan: str):
    """Сбрасывает счётчик AI-запросов, если истёк месячный период"""
    cur.execute(
        f"""SELECT requests_used, requests_limit, requests_reset_at, energy_balance
            FROM {schema}.users WHERE id = %s""",
        (user_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    used, limit, reset_at, energy = row
    from datetime import timezone
    if reset_at and reset_at <= datetime.now(timezone.utc):
        used = 0
        limit = PLAN_LIMITS.get(plan, limit)
        cur.execute(
            f"""UPDATE {schema}.users
                SET requests_used = 0, requests_limit = %s, requests_reset_at = NOW() + INTERVAL '30 days', low_balance_notified = false
                WHERE id = %s""",
            (limit, user_id)
        )
    return {'requests_used': used, 'requests_limit': limit, 'energy_balance': energy}

def hash_password(password: str) -> str:
    """bcrypt с солью — безопасное хэширование"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    """Проверка пароля с поддержкой старого SHA-256 для миграции"""
    try:
        # Новый формат — bcrypt
        if hashed.startswith('$2b$') or hashed.startswith('$2a$'):
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        # Старый формат — SHA-256 (обратная совместимость)
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest() == hashed
    except Exception:
        return False

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Session-ID, x-session-id',
        'Access-Control-Max-Age': '86400',
    }

def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': cors_headers(), 'body': data}

def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': cors_headers(), 'body': {'error': msg}}

# --- Rate limiting через БД ---
def check_rate_limit(conn, schema: str, key: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
    """
    Проверяет rate limit. Возвращает True если разрешено, False если превышено.
    Fail-closed: при ошибке БД — блокируем (безопаснее).
    """
    # Санитизация — только int, чтобы исключить SQL-инъекцию через f-string
    window_minutes = int(window_minutes)
    max_attempts = int(max_attempts)
    try:
        with conn.cursor() as cur:
            # Параметризованный INTERVAL через make_interval
            cur.execute(
                f"DELETE FROM {schema}.rate_limits WHERE key = %s AND created_at < NOW() - make_interval(mins => %s)",
                (key, window_minutes)
            )
            cur.execute(
                f"SELECT COUNT(*) FROM {schema}.rate_limits WHERE key = %s",
                (key,)
            )
            count = cur.fetchone()[0]
            if count >= max_attempts:
                conn.commit()
                return False
            cur.execute(
                f"INSERT INTO {schema}.rate_limits (key) VALUES (%s)",
                (key,)
            )
            conn.commit()
            return True
    except Exception:
        # Fail-closed: при ошибке блокируем для безопасности
        try:
            conn.rollback()
        except Exception:
            pass
        return False

def handler(event: dict, context) -> dict:
    """Регистрация, вход и получение профиля пользователя"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        return err('Некорректный формат данных запроса', 400)
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    schema = get_schema()
    ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp', 'unknown')

    if method == 'POST':
        action = body.get('action', '')

        # REGISTER
        if action == 'register':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            name = body.get('name', '').strip()
            if not email or '@' not in email:
                return err('Укажите корректный e-mail')
            if len(password) < 6:
                return err('Пароль должен быть не менее 6 символов')
            if not name:
                return err('Укажите ваше имя')

            conn = get_conn()
            try:
                # Rate limit: 10 регистраций с одного IP за час
                if not check_rate_limit(conn, schema, f'register:{ip}', max_attempts=10, window_minutes=60):
                    return err('Слишком много попыток. Попробуйте позже.', 429)

                with conn.cursor() as cur:
                    cur.execute(f"SELECT id FROM {schema}.users WHERE email = %s", (email,))
                    if cur.fetchone():
                        return err('Пользователь с таким e-mail уже существует')
                    cur.execute(
                        f"""INSERT INTO {schema}.users (email, password_hash, name, requests_limit, energy_balance)
                            VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                        (email, hash_password(password), name, PLAN_LIMITS['free'], STARTER_ENERGY)
                    )
                    user_id = cur.fetchone()[0]
                    session_id = new_session_id()
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                conn.commit()
            finally:
                conn.close()
            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': email, 'name': name, 'plan': 'free', 'requests_used': 0, 'requests_limit': PLAN_LIMITS['free'], 'energy_balance': STARTER_ENERGY}})

        # LOGIN
        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            if not email or not password:
                return err('Введите e-mail и пароль')

            conn = get_conn()
            try:
                # Rate limit: 5 попыток входа с одного IP за 15 минут
                if not check_rate_limit(conn, schema, f'login:{ip}', max_attempts=5, window_minutes=15):
                    return err('Слишком много попыток входа. Попробуйте через 15 минут.', 429)

                with conn.cursor() as cur:
                    cur.execute(
                        f"SELECT id, name, plan, password_hash FROM {schema}.users WHERE email = %s",
                        (email,)
                    )
                    row = cur.fetchone()
                    if not row or not check_password(password, row[3]):
                        return err('Неверный e-mail или пароль')

                    user_id, name, plan, pw_hash = row

                    # Миграция: обновляем старый SHA-256 хэш на bcrypt
                    if not (pw_hash.startswith('$2b$') or pw_hash.startswith('$2a$')):
                        new_hash = hash_password(password)
                        cur.execute(
                            f"UPDATE {schema}.users SET password_hash = %s WHERE id = %s",
                            (new_hash, user_id)
                        )

                    session_id = new_session_id()
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                    quota = reset_requests_if_needed(cur, schema, user_id, plan)
                conn.commit()
            finally:
                conn.close()
            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': email, 'name': name, 'plan': plan, **(quota or {})}})

        # GITHUB OAUTH
        if action == 'github_oauth':
            code = body.get('code', '')
            if not code:
                return err('Нет кода авторизации')

            client_id = os.environ.get('GITHUB_CLIENT_ID', '')
            client_secret = os.environ.get('GITHUB_CLIENT_SECRET', '')

            token_data = urllib.parse.urlencode({
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
            }).encode()
            req = urllib.request.Request(
                'https://github.com/login/oauth/access_token',
                data=token_data,
                headers={'Accept': 'application/json'},
            )
            with urllib.request.urlopen(req) as resp:
                token_resp = json.loads(resp.read())

            access_token = token_resp.get('access_token', '')
            if not access_token:
                return err('Не удалось получить токен GitHub')

            user_req = urllib.request.Request(
                'https://api.github.com/user',
                headers={'Authorization': f'Bearer {access_token}', 'Accept': 'application/json', 'User-Agent': 'Roboweb'},
            )
            with urllib.request.urlopen(user_req) as resp:
                gh_user = json.loads(resp.read())

            gh_email = gh_user.get('email') or ''
            if not gh_email:
                email_req = urllib.request.Request(
                    'https://api.github.com/user/emails',
                    headers={'Authorization': f'Bearer {access_token}', 'Accept': 'application/json', 'User-Agent': 'Roboweb'},
                )
                with urllib.request.urlopen(email_req) as resp:
                    emails = json.loads(resp.read())
                primary = next((e for e in emails if e.get('primary')), None)
                gh_email = primary['email'] if primary else f"github_{gh_user['id']}@roboweb.user"

            gh_name = gh_user.get('name') or gh_user.get('login') or 'GitHub User'
            gh_login = gh_user.get('login') or ''
            gh_email = gh_email.strip().lower()

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT id, name, plan FROM {schema}.users WHERE email = %s", (gh_email,))
                    row = cur.fetchone()
                    is_new_user = not row
                    if row:
                        user_id, name, plan = row
                    else:
                        cur.execute(
                            f"""INSERT INTO {schema}.users (email, password_hash, name, requests_limit, energy_balance)
                                VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                            (gh_email, hash_password(str(uuid.uuid4())), gh_name, PLAN_LIMITS['free'], STARTER_ENERGY)
                        )
                        user_id = cur.fetchone()[0]
                        name, plan = gh_name, 'free'

                    # Сохраняем токен и логин GitHub — нужны для публикации сайтов в репозиторий
                    cur.execute(
                        f"UPDATE {schema}.users SET github_access_token = %s, github_login = %s WHERE id = %s",
                        (access_token, gh_login, user_id)
                    )

                    session_id = new_session_id()
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                    quota = reset_requests_if_needed(cur, schema, user_id, plan)
                conn.commit()
            finally:
                conn.close()

            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': gh_email, 'name': name, 'plan': plan, 'github_login': gh_login, **(quota or {})}, 'is_new_user': is_new_user})

        # GITHUB CONNECT — привязка GitHub к уже авторизованному аккаунту (не меняет сессию/email)
        if action == 'github_connect':
            session_id = headers.get('x-session-id', '')
            if not session_id:
                return err('Не авторизован', 401)

            code = body.get('code', '')
            if not code:
                return err('Нет кода авторизации')

            client_id = os.environ.get('GITHUB_CLIENT_ID', '')
            client_secret = os.environ.get('GITHUB_CLIENT_SECRET', '')

            token_data = urllib.parse.urlencode({
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
            }).encode()
            req = urllib.request.Request(
                'https://github.com/login/oauth/access_token',
                data=token_data,
                headers={'Accept': 'application/json'},
            )
            with urllib.request.urlopen(req) as resp:
                token_resp = json.loads(resp.read())

            access_token = token_resp.get('access_token', '')
            if not access_token:
                return err('Не удалось получить токен GitHub')

            user_req = urllib.request.Request(
                'https://api.github.com/user',
                headers={'Authorization': f'Bearer {access_token}', 'Accept': 'application/json', 'User-Agent': 'Roboweb'},
            )
            with urllib.request.urlopen(user_req) as resp:
                gh_user = json.loads(resp.read())

            gh_login = gh_user.get('login') or ''

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    user_id = get_user_id_by_session(cur, schema, session_id)
                    if not user_id:
                        return err('Сессия истекла', 401)
                    cur.execute(
                        f"UPDATE {schema}.users SET github_access_token = %s, github_login = %s WHERE id = %s",
                        (access_token, gh_login, user_id)
                    )
                conn.commit()
            finally:
                conn.close()

            return ok({'ok': True, 'github_login': gh_login})

        # YANDEX OAUTH
        if action == 'yandex_oauth':
            code = body.get('code', '')
            if not code:
                return err('Нет кода авторизации')

            client_id = os.environ.get('YANDEX_CLIENT_ID', '')
            client_secret = os.environ.get('YANDEX_CLIENT_SECRET', '')

            token_data = urllib.parse.urlencode({
                'grant_type': 'authorization_code',
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
            }).encode()
            req = urllib.request.Request(
                'https://oauth.yandex.ru/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
            )
            try:
                with urllib.request.urlopen(req) as resp:
                    token_resp = json.loads(resp.read())
            except Exception:
                return err('Не удалось получить токен Яндекс')

            access_token = token_resp.get('access_token', '')
            if not access_token:
                return err('Не удалось получить токен Яндекс')

            user_req = urllib.request.Request(
                'https://login.yandex.ru/info?format=json',
                headers={'Authorization': f'OAuth {access_token}'},
            )
            with urllib.request.urlopen(user_req) as resp:
                ya_user = json.loads(resp.read())

            ya_email = ya_user.get('default_email') or ya_user.get('emails', [None])[0] or f"yandex_{ya_user['id']}@roboweb.user"
            ya_name = ya_user.get('real_name') or ya_user.get('display_name') or 'Яндекс Пользователь'
            ya_email = ya_email.strip().lower()

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT id, name, plan FROM {schema}.users WHERE email = %s", (ya_email,))
                    row = cur.fetchone()
                    is_new_user = not row
                    if row:
                        user_id, name, plan = row
                    else:
                        cur.execute(
                            f"""INSERT INTO {schema}.users (email, password_hash, name, requests_limit, energy_balance)
                                VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                            (ya_email, hash_password(str(uuid.uuid4())), ya_name, PLAN_LIMITS['free'], STARTER_ENERGY)
                        )
                        user_id = cur.fetchone()[0]
                        name, plan = ya_name, 'free'

                    session_id = new_session_id()
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                    quota = reset_requests_if_needed(cur, schema, user_id, plan)
                conn.commit()
            finally:
                conn.close()

            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': ya_email, 'name': name, 'plan': plan, **(quota or {})}, 'is_new_user': is_new_user})

        # CHANGE PASSWORD
        if action == 'change_password':
            session_id = headers.get('x-session-id', '')
            if not session_id:
                return err('Не авторизован', 401)
            old_password = body.get('old_password', '')
            new_password = body.get('new_password', '')
            if not old_password:
                return err('Укажите текущий пароль')
            if len(new_password) < 6:
                return err('Новый пароль должен быть не менее 6 символов')

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    user_id = get_user_id_by_session(cur, schema, session_id)
                    if not user_id:
                        return err('Сессия истекла', 401)
                    cur.execute(f"SELECT password_hash FROM {schema}.users WHERE id = %s", (user_id,))
                    row = cur.fetchone()
                    if not row or not check_password(old_password, row[0]):
                        return err('Текущий пароль указан неверно')
                    cur.execute(
                        f"UPDATE {schema}.users SET password_hash = %s WHERE id = %s",
                        (hash_password(new_password), user_id)
                    )
                    # Безопасность: после смены пароля завершаем ВСЕ остальные сессии пользователя
                    # (кроме текущей) — если аккаунт был скомпрометирован, чужие входы отключатся.
                    cur.execute(
                        f"DELETE FROM {schema}.sessions WHERE user_id = %s AND id != %s",
                        (user_id, session_id)
                    )
                conn.commit()
            finally:
                conn.close()
            return ok({'ok': True})

        # UPDATE NAME
        if action == 'update_name':
            session_id = headers.get('x-session-id', '')
            if not session_id:
                return err('Не авторизован', 401)
            new_name = body.get('name', '').strip()
            if not new_name:
                return err('Укажите имя')

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    user_id = get_user_id_by_session(cur, schema, session_id)
                    if not user_id:
                        return err('Сессия истекла', 401)
                    cur.execute(f"UPDATE {schema}.users SET name = %s WHERE id = %s", (new_name, user_id))
                conn.commit()
            finally:
                conn.close()
            return ok({'ok': True, 'name': new_name})

        # DISCONNECT GITHUB
        if action == 'disconnect_github':
            session_id = headers.get('x-session-id', '')
            if not session_id:
                return err('Не авторизован', 401)

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    user_id = get_user_id_by_session(cur, schema, session_id)
                    if not user_id:
                        return err('Сессия истекла', 401)
                    cur.execute(
                        f"UPDATE {schema}.users SET github_access_token = NULL, github_login = NULL WHERE id = %s",
                        (user_id,)
                    )
                conn.commit()
            finally:
                conn.close()
            return ok({'ok': True})

        # DELETE ACCOUNT
        if action == 'delete_account':
            session_id = headers.get('x-session-id', '')
            if not session_id:
                return err('Не авторизован', 401)
            password = body.get('password', '')

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    user_id = get_user_id_by_session(cur, schema, session_id)
                    if not user_id:
                        return err('Сессия истекла', 401)
                    cur.execute(f"SELECT password_hash FROM {schema}.users WHERE id = %s", (user_id,))
                    row = cur.fetchone()
                    if row and row[0] and not check_password(password, row[0]):
                        return err('Пароль указан неверно')
                    cur.execute(f"UPDATE {schema}.sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
                    cur.execute(f"UPDATE {schema}.projects SET user_id = NULL WHERE user_id = %s", (user_id,))
                    cur.execute(
                        f"UPDATE {schema}.users SET email = 'deleted_' || id || '@deleted', name = 'Удалён', blocked = true WHERE id = %s",
                        (user_id,)
                    )
                conn.commit()
            finally:
                conn.close()
            return ok({'ok': True})

        return err('Неизвестное действие')

    # GET /me или GET /me?action=orders
    if method == 'GET':
        session_id = headers.get('x-session-id', '')
        if not session_id:
            return err('Не авторизован', 401)

        params = event.get('queryStringParameters') or {}

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                user_id = get_user_id_by_session(cur, schema, session_id)
                if not user_id:
                    return err('Сессия истекла', 401)

                if params.get('action') == 'orders':
                    cur.execute(
                        f"""SELECT order_number, order_type, plan, energy_amount, billing_period, amount, status, created_at, paid_at
                            FROM {schema}.orders WHERE user_id = %s ORDER BY created_at DESC LIMIT 50""",
                        (user_id,)
                    )
                    rows = cur.fetchall()
                    orders = [{
                        'order_number': r[0], 'order_type': r[1], 'plan': r[2], 'energy_amount': r[3],
                        'billing_period': r[4], 'amount': float(r[5]), 'status': r[6],
                        'created_at': r[7].isoformat() if r[7] else None,
                        'paid_at': r[8].isoformat() if r[8] else None,
                    } for r in rows]
                    return ok({'orders': orders})

                cur.execute(
                    f"""SELECT email, name, plan, created_at, github_login FROM {schema}.users WHERE id = %s""",
                    (user_id,)
                )
                row = cur.fetchone()
                if not row:
                    return err('Пользователь не найден', 404)
                email, name, plan, created_at, github_login = row
                quota = reset_requests_if_needed(cur, schema, user_id, plan)
                conn.commit()
        finally:
            conn.close()

        return ok({'user': {
            'id': user_id, 'email': email, 'name': name, 'plan': plan,
            'created_at': created_at.isoformat(), 'github_login': github_login, **(quota or {}),
        }})

    return err('Not found', 404)