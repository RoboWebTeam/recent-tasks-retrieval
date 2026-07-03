import os
import json
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

def ok(data): return {'statusCode': 200, 'headers': cors_headers(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors_headers(), 'body': {'error': msg}}

def handler(event: dict, context) -> dict:
    """Отдаёт HTML опубликованного сайта по публичному slug — без авторизации"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    params = event.get('queryStringParameters') or {}
    slug = params.get('slug', '').strip()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not slug:
        return err('Укажите slug сайта')

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT title, html_content FROM {schema}.projects WHERE slug = %s AND status = 'published'",
                (slug,)
            )
            row = cur.fetchone()
            if not row:
                return err('Сайт не найден или не опубликован', 404)

            title, html_content = row
            if not html_content:
                return err('Сайт не найден или не опубликован', 404)

            return ok({'title': title, 'html': html_content})
    finally:
        conn.close()
