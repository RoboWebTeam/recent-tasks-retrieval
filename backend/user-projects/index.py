import os
import json
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

def ok(data): return {'statusCode': 200, 'headers': cors_headers(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors_headers(), 'body': {'error': msg}}

def get_user_id(cur, session_id: str, schema: str):
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    """CRUD проектов пользователя"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id', '')
    body = json.loads(event.get('body') or '{}')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not session_id:
        return err('Не авторизован', 401)

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            user_id = get_user_id(cur, session_id, schema)
            if not user_id:
                return err('Сессия истекла', 401)

            # GET — список проектов
            if method == 'GET':
                cur.execute(
                    f"SELECT id, title, description, status, url, created_at, updated_at FROM {schema}.projects WHERE user_id = %s ORDER BY updated_at DESC",
                    (user_id,)
                )
                rows = cur.fetchall()
                projects = [
                    {'id': r[0], 'title': r[1], 'description': r[2], 'status': r[3],
                     'url': r[4], 'created_at': r[5].isoformat(), 'updated_at': r[6].isoformat()}
                    for r in rows
                ]
                return ok({'projects': projects})

            # POST — создать проект
            if method == 'POST':
                title = body.get('title', '').strip()
                description = body.get('description', '').strip()
                if not title:
                    return err('Укажите название проекта')
                cur.execute(
                    f"INSERT INTO {schema}.projects (user_id, title, description) VALUES (%s, %s, %s) RETURNING id, created_at",
                    (user_id, title, description)
                )
                project_id, created_at = cur.fetchone()
                conn.commit()
                return ok({'project': {'id': project_id, 'title': title, 'description': description, 'status': 'draft', 'url': '', 'created_at': created_at.isoformat()}})

            # PUT — обновить проект
            if method == 'PUT':
                project_id = body.get('id')
                if not project_id:
                    return err('Укажите id проекта')
                cur.execute(
                    f"UPDATE {schema}.projects SET title = %s, description = %s, status = %s, url = %s, updated_at = NOW() WHERE id = %s AND user_id = %s",
                    (body.get('title', ''), body.get('description', ''), body.get('status', 'draft'), body.get('url', ''), project_id, user_id)
                )
                conn.commit()
                return ok({'ok': True})

    finally:
        conn.close()

    return err('Not found', 404)
