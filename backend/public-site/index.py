import os
import re
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

def extract_meta(html: str) -> dict:
    """Достаёт title, meta description и og:image прямо из сгенерированного HTML сайта,
    чтобы отдать их отдельно фронтенду для правильных SEO-тегов страницы."""
    title_m = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    desc_m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    og_image_m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    lang_m = re.search(r'<html[^>]+lang=["\']([a-zA-Z-]+)["\']', html, re.IGNORECASE)
    return {
        'meta_title': title_m.group(1).strip() if title_m else '',
        'meta_description': desc_m.group(1).strip() if desc_m else '',
        'meta_image': og_image_m.group(1).strip() if og_image_m else '',
        'lang': lang_m.group(1).strip() if lang_m else 'ru',
    }

def handler(event: dict, context) -> dict:
    """Отдаёт HTML опубликованного сайта по публичному slug — без авторизации.
    Дополнительно парсит title/description/og:image из HTML для корректных SEO-тегов страницы."""

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
                f"SELECT id, title, description, html_content FROM {schema}.projects WHERE slug = %s AND status = 'published'",
                (slug,)
            )
            row = cur.fetchone()
            if not row:
                return err('Сайт не найден или не опубликован', 404)

            project_id, title, description, html_content = row
            if not html_content:
                return err('Сайт не найден или не опубликован', 404)

            # Если у проекта уже подключён и верифицирован собственный домен —
            # там контент раздаётся напрямую (лучше для SEO), а копию на /site/:slug
            # помечаем noindex на фронтенде, чтобы избежать дублей в поиске.
            cur.execute(
                f"SELECT 1 FROM {schema}.domains WHERE project_id = %s AND status = 'active' LIMIT 1",
                (project_id,)
            )
            has_active_domain = cur.fetchone() is not None

            meta = extract_meta(html_content)

            return ok({
                'title': meta['meta_title'] or title,
                'description': meta['meta_description'] or description or '',
                'image': meta['meta_image'],
                'lang': meta['lang'],
                'html': html_content,
                'has_custom_domain': has_active_domain,
            })
    finally:
        conn.close()