import os
import json
import uuid
import bcrypt
import psycopg2
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

SCHEMA = None

def get_schema():
    global SCHEMA
    if not SCHEMA:
        SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return SCHEMA

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

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
    body = json.loads(event.get('body') or '{}')
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
                        f"INSERT INTO {schema}.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                        (email, hash_password(password), name)
                    )
                    user_id = cur.fetchone()[0]
                    session_id = str(uuid.uuid4())
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                conn.commit()
            finally:
                conn.close()
            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': email, 'name': name, 'plan': 'free'}})

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

                    session_id = str(uuid.uuid4())
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                conn.commit()
            finally:
                conn.close()
            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': email, 'name': name, 'plan': plan}})

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
            gh_email = gh_email.strip().lower()

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT id, name, plan FROM {schema}.users WHERE email = %s", (gh_email,))
                    row = cur.fetchone()
                    if row:
                        user_id, name, plan = row
                    else:
                        cur.execute(
                            f"INSERT INTO {schema}.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                            (gh_email, hash_password(str(uuid.uuid4())), gh_name)
                        )
                        user_id = cur.fetchone()[0]
                        name, plan = gh_name, 'free'

                    session_id = str(uuid.uuid4())
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                conn.commit()
            finally:
                conn.close()

            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': gh_email, 'name': name, 'plan': plan}})

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
                    if row:
                        user_id, name, plan = row
                    else:
                        cur.execute(
                            f"INSERT INTO {schema}.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                            (ya_email, hash_password(str(uuid.uuid4())), ya_name)
                        )
                        user_id = cur.fetchone()[0]
                        name, plan = ya_name, 'free'

                    session_id = str(uuid.uuid4())
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                conn.commit()
            finally:
                conn.close()

            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': ya_email, 'name': name, 'plan': plan}})

        # TELEGRAM OAUTH
        if action == 'telegram_oauth':
            import hashlib
            import hmac

            tg_data = body.get('tg_data', {})
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')

            # Верификация подписи от Telegram
            check_hash = tg_data.pop('hash', '')
            data_check_arr = sorted([f"{k}={v}" for k, v in tg_data.items()])
            data_check_string = '\n'.join(data_check_arr)
            secret_key = hashlib.sha256(bot_token.encode()).digest()
            computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

            if computed_hash != check_hash:
                return err('Неверная подпись Telegram', 403)

            # Проверка актуальности данных (не старше 1 часа)
            auth_date = int(tg_data.get('auth_date', 0))
            if datetime.utcnow().timestamp() - auth_date > 3600:
                return err('Данные авторизации устарели', 403)

            tg_id = tg_data.get('id')
            tg_first = tg_data.get('first_name', '')
            tg_last = tg_data.get('last_name', '')
            tg_username = tg_data.get('username', '')
            tg_name = f"{tg_first} {tg_last}".strip() or tg_username or 'Telegram User'
            tg_email = f"tg_{tg_id}@roboweb.user"

            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT id, name, plan FROM {schema}.users WHERE email = %s", (tg_email,))
                    row = cur.fetchone()
                    if row:
                        user_id, name, plan = row
                    else:
                        cur.execute(
                            f"INSERT INTO {schema}.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                            (tg_email, hash_password(str(uuid.uuid4())), tg_name)
                        )
                        user_id = cur.fetchone()[0]
                        name, plan = tg_name, 'free'

                    session_id = str(uuid.uuid4())
                    cur.execute(
                        f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                        (session_id, user_id)
                    )
                conn.commit()
            finally:
                conn.close()

            return ok({'session_id': session_id, 'user': {'id': user_id, 'email': tg_email, 'name': name, 'plan': plan}})

        return err('Неизвестное действие')

    # GET /me
    if method == 'GET':
        session_id = headers.get('x-session-id', '')
        if not session_id:
            return err('Не авторизован', 401)

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT u.id, u.email, u.name, u.plan, u.created_at
                        FROM {schema}.sessions s
                        JOIN {schema}.users u ON u.id = s.user_id
                        WHERE s.id = %s AND s.expires_at > NOW()""",
                    (session_id,)
                )
                row = cur.fetchone()
        finally:
            conn.close()

        if not row:
            return err('Сессия истекла', 401)

        user_id, email, name, plan, created_at = row
        return ok({'user': {'id': user_id, 'email': email, 'name': name, 'plan': plan, 'created_at': created_at.isoformat()}})

    return err('Not found', 404)