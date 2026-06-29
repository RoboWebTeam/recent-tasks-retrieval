import os
import json
import uuid
import hashlib
import psycopg2

SCHEMA = None

def get_schema():
    global SCHEMA
    if not SCHEMA:
        SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return SCHEMA

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': cors_headers(), 'body': data}

def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': cors_headers(), 'body': {'error': msg}}

def handler(event: dict, context) -> dict:
    """Регистрация, вход и получение профиля пользователя"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    body = json.loads(event.get('body') or '{}')
    headers = event.get('headers') or {}
    schema = get_schema()

    # POST /register
    if method == 'POST' and '/register' in path:
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

    # POST /login
    if method == 'POST' and '/login' in path:
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        if not email or not password:
            return err('Введите e-mail и пароль')

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, name, plan FROM {schema}.users WHERE email = %s AND password_hash = %s",
                    (email, hash_password(password))
                )
                row = cur.fetchone()
                if not row:
                    return err('Неверный e-mail или пароль')
                user_id, name, plan = row
                session_id = str(uuid.uuid4())
                cur.execute(
                    f"INSERT INTO {schema}.sessions (id, user_id) VALUES (%s, %s)",
                    (session_id, user_id)
                )
            conn.commit()
        finally:
            conn.close()

        return ok({'session_id': session_id, 'user': {'id': user_id, 'email': email, 'name': name, 'plan': plan}})

    # GET /me — получить профиль по сессии
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
