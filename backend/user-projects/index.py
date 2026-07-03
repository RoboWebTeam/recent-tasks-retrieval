import os
import json
import re
import random
import string
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

def slugify(title: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', title.lower().strip()).strip('-')[:40]
    if not base:
        base = 'site'
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{base}-{suffix}"

def handler(event: dict, context) -> dict:
    """CRUD проектов пользователя, включая публикацию сайта с генерацией публичной ссылки"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    session_id = headers.get('x-session-id', '')
    body = json.loads(event.get('body') or '{}')
    params = event.get('queryStringParameters') or {}
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not session_id:
        return err('Не авторизован', 401)

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            user_id = get_user_id(cur, session_id, schema)
            if not user_id:
                return err('Сессия истекла', 401)

            # GET — один проект по id (с html_content) или список проектов
            if method == 'GET':
                project_id = params.get('id')

                if project_id:
                    cur.execute(
                        f"SELECT id, title, description, status, url, slug, html_content, created_at, updated_at "
                        f"FROM {schema}.projects WHERE id = %s AND user_id = %s",
                        (project_id, user_id)
                    )
                    row = cur.fetchone()
                    if not row:
                        return err('Проект не найден', 404)
                    project = {
                        'id': row[0], 'title': row[1], 'description': row[2], 'status': row[3],
                        'url': row[4], 'slug': row[5], 'html_content': row[6],
                        'created_at': row[7].isoformat(), 'updated_at': row[8].isoformat(),
                    }
                    return ok({'project': project})

                cur.execute(
                    f"SELECT id, title, description, status, url, slug, created_at, updated_at "
                    f"FROM {schema}.projects WHERE user_id = %s ORDER BY updated_at DESC",
                    (user_id,)
                )
                rows = cur.fetchall()
                projects = [
                    {'id': r[0], 'title': r[1], 'description': r[2], 'status': r[3],
                     'url': r[4], 'slug': r[5], 'created_at': r[6].isoformat(), 'updated_at': r[7].isoformat()}
                    for r in rows
                ]
                return ok({'projects': projects})

            # POST — создать проект / опубликовать проект
            if method == 'POST':
                action = body.get('action', 'create')

                if action == 'publish':
                    project_id = body.get('id')
                    if not project_id:
                        return err('Укажите id проекта')
                    cur.execute(
                        f"SELECT slug, html_content FROM {schema}.projects WHERE id = %s AND user_id = %s",
                        (project_id, user_id)
                    )
                    row = cur.fetchone()
                    if not row:
                        return err('Проект не найден', 404)
                    existing_slug, html_content = row
                    if not html_content:
                        return err('Сначала сгенерируйте сайт перед публикацией')

                    slug = existing_slug
                    if not slug:
                        for _ in range(5):
                            candidate = slugify(body.get('title', 'site'))
                            cur.execute(f"SELECT 1 FROM {schema}.projects WHERE slug = %s", (candidate,))
                            if not cur.fetchone():
                                slug = candidate
                                break

                    cur.execute(
                        f"UPDATE {schema}.projects SET status = 'published', slug = %s, updated_at = NOW() WHERE id = %s",
                        (slug, project_id)
                    )
                    conn.commit()
                    return ok({'slug': slug, 'status': 'published'})

                title = body.get('title', '').strip()
                description = body.get('description', '').strip()
                if not title:
                    return err('Укажите название проекта')
                cur.execute(
                    f"INSERT INTO {schema}.projects (user_id, title, description) VALUES (%s, %s, %s) RETURNING id, created_at, updated_at",
                    (user_id, title, description)
                )
                project_id, created_at, updated_at = cur.fetchone()
                conn.commit()
                return ok({'project': {'id': project_id, 'title': title, 'description': description, 'status': 'draft', 'url': '', 'slug': None, 'created_at': created_at.isoformat(), 'updated_at': updated_at.isoformat()}})

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
