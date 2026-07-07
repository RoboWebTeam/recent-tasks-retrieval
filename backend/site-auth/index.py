"""Аккаунты посетителей сайта (Этап 3 фуллстека «Аккаунты»).

У каждого сгенерированного сайта — свои пользователи-посетители, отдельные от владельцев RoboWeb.
Публичный endpoint (без owner-сессии): register / login / me / logout. Всё строго изолировано
по project_id: сессия привязана к проекту, токен одного сайта не действует на другом.
"""
import os
import json
import secrets
import psycopg2

try:
    import bcrypt
except Exception:
    bcrypt = None


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-RW-Token',
        'Access-Control-Max-Age': '86400',
    }


def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': data}


def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


# Фиктивный хэш для постоянного времени login (когда пользователя нет — всё равно считаем bcrypt,
# чтобы по времени ответа нельзя было понять, существует ли аккаунт). Считается один раз при импорте.
_DUMMY_HASH = (bcrypt.hashpw(b'x', bcrypt.gensalt(rounds=12)).decode('utf-8')
               if bcrypt else '$2b$12$' + 'x' * 53)


def _new_token():
    return secrets.token_urlsafe(32)


def _client_ip(headers, event):
    """Доверенный IP: ПОСЛЕДНИЙ элемент X-Forwarded-For (его дописывает наш nginx), не первый —
    первый подделывает клиент и обходит rate-limit."""
    xff = headers.get('x-forwarded-for', '')
    if xff:
        return xff.split(',')[-1].strip()
    return ((event.get('requestContext', {}) or {}).get('identity', {}) or {}).get('sourceIp', '') or 'unknown'


def _hash_pw(pw):
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def _check_pw(pw, hashed):
    try:
        return bcrypt.checkpw(pw.encode('utf-8'), (hashed or '').encode('utf-8'))
    except Exception:
        return False


def _rate_limited(cur, schema, key, limit, window_min):
    """DELETE-старых + COUNT + INSERT. Fail-closed при ошибке БД."""
    try:
        cur.execute(f"DELETE FROM {schema}.rate_limits WHERE key = %s AND created_at < NOW() - make_interval(mins => %s)", (key, window_min))
        cur.execute(f"SELECT COUNT(*) FROM {schema}.rate_limits WHERE key = %s", (key,))
        if cur.fetchone()[0] >= limit:
            return True
        cur.execute(f"INSERT INTO {schema}.rate_limits (key) VALUES (%s)", (key,))
        return False
    except Exception:
        return True


def resolve_site_session(cur, schema, token, project_id):
    """Токен → пользователь сайта, СТРОГО в рамках project_id. None если невалиден/просрочен/чужой проект."""
    if not token:
        return None
    cur.execute(
        f"""SELECT u.id, u.email, u.name FROM {schema}.project_site_sessions s
            JOIN {schema}.project_site_users u ON u.id = s.site_user_id
            WHERE s.token = %s AND s.project_id = %s AND s.expires_at > NOW()""",
        (token, project_id)
    )
    r = cur.fetchone()
    return {'id': r[0], 'email': r[1], 'name': r[2]} if r else None


def handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}
    if bcrypt is None:
        return err('Сервис недоступен', 500)

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-rw-token', '')
    ip = _client_ip(headers, event)
    params = event.get('queryStringParameters') or {}
    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        return err('Некорректный формат данных запроса')

    project_id = body.get('project_id') or params.get('project_id')
    try:
        project_id = int(project_id)
    except (TypeError, ValueError):
        return err('Укажите project_id')

    action = body.get('action') or params.get('action') or ('me' if method == 'GET' else '')

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Проект должен существовать (иначе не даём создавать «висячих» юзеров).
            cur.execute(f"SELECT 1 FROM {get_schema()}.projects WHERE id = %s", (project_id,))
            if not cur.fetchone():
                return err('Сайт не найден', 404)
            schema = get_schema()

            # ── ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ──
            if action == 'me':
                user = resolve_site_session(cur, schema, token, project_id)
                conn.commit()
                return ok({'user': user}) if user else err('Не авторизован', 401)

            # ── ВЫХОД ── (физически удаляем токен — не копим мусор)
            if action == 'logout':
                if token:
                    cur.execute(f"DELETE FROM {schema}.project_site_sessions WHERE token = %s AND project_id = %s", (token, project_id))
                conn.commit()
                return ok({'ok': True})

            # ── РЕГИСТРАЦИЯ ──
            if action == 'register':
                email = (body.get('email') or '').strip().lower()
                password = body.get('password') or ''
                # name без угловых скобок — против хранёного XSS в личном кабинете (доп. к textContent на клиенте)
                name = (body.get('name') or '').strip().replace('<', '').replace('>', '')[:100]
                if not email or '@' not in email or len(email) > 254:
                    return err('Укажите корректный e-mail')
                if len(password) < 8 or len(password) > 128:
                    return err('Пароль: от 8 до 128 символов')
                if _rate_limited(cur, schema, f'sreg:{ip}:{project_id}', 10, 60) or \
                   _rate_limited(cur, schema, f'sregp:{project_id}', 200, 60):  # + лимит на весь проект
                    conn.commit()
                    return err('Слишком много регистраций, попробуйте позже', 429)
                # Полагаемся на UNIQUE(project_id, lower(email)) через ON CONFLICT — без TOCTOU-гонки.
                cur.execute(
                    f"""INSERT INTO {schema}.project_site_users (project_id, email, password_hash, name)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (project_id, lower(email)) DO NOTHING RETURNING id""",
                    (project_id, email, _hash_pw(password), name)
                )
                r = cur.fetchone()
                if not r:
                    conn.commit()
                    return err('Не удалось зарегистрировать — возможно, e-mail уже используется')
                uid = r[0]
                tok = _new_token()
                cur.execute(
                    f"INSERT INTO {schema}.project_site_sessions (token, site_user_id, project_id) VALUES (%s, %s, %s)",
                    (tok, uid, project_id)
                )
                conn.commit()
                return ok({'token': tok, 'user': {'id': uid, 'email': email, 'name': name}})

            # ── ВХОД ──
            if action == 'login':
                email = (body.get('email') or '').strip().lower()
                password = body.get('password') or ''
                if not email or not password:
                    return err('Введите e-mail и пароль')
                if _rate_limited(cur, schema, f'slog:{ip}:{project_id}', 8, 15):
                    conn.commit()
                    return err('Слишком много попыток входа, попробуйте позже', 429)
                cur.execute(
                    f"SELECT id, name, password_hash FROM {schema}.project_site_users WHERE project_id = %s AND lower(email) = %s",
                    (project_id, email)
                )
                row = cur.fetchone()
                # ПОСТОЯННОЕ ВРЕМЯ: bcrypt считаем всегда (для несуществующего — против фиктивного хэша),
                # чтобы по времени ответа нельзя было определить, есть ли аккаунт. Ответ единый.
                if not _check_pw(password, row[2] if row else _DUMMY_HASH) or not row:
                    conn.commit()
                    return err('Неверный e-mail или пароль', 401)
                uid, name = row[0], row[1]
                tok = _new_token()
                cur.execute(
                    f"INSERT INTO {schema}.project_site_sessions (token, site_user_id, project_id) VALUES (%s, %s, %s)",
                    (tok, uid, project_id)
                )
                conn.commit()
                return ok({'token': tok, 'user': {'id': uid, 'email': email, 'name': name}})

            return err('Неизвестное действие')
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        return err('Ошибка обработки запроса', 500)
    finally:
        conn.close()
