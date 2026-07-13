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

BADGE_MARKER = 'data-roboweb-badge'
BADGE_URL = 'https://roboweb.dev/?utm_source=badge&utm_medium=referral&utm_campaign=made_with'

def inject_badge(html: str) -> str:
    """Вставляет ненавязчивый виральный бейдж «Сделано на RoboWeb» с обратной ссылкой
    в правый нижний угол опубликованного сайта. Показывается только на бесплатном тарифе —
    платные тарифы (Премиум/Профи) убирают его автоматически. Идемпотентно: если бейдж уже есть,
    повторно не добавляет."""
    if not html or BADGE_MARKER in html:
        return html
    badge = (
        '<a ' + BADGE_MARKER + '="1" href="' + BADGE_URL + '" target="_blank" rel="noopener noreferrer nofollow" '
        'aria-label="Сделано на RoboWeb — создать сайт с ИИ" '
        'style="position:fixed;right:14px;bottom:14px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;'
        'padding:7px 12px 7px 10px;border-radius:999px;background:rgba(15,23,32,.86);color:#fff;'
        'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;'
        'font-size:12.5px;font-weight:600;line-height:1;text-decoration:none;letter-spacing:.01em;'
        'box-shadow:0 6px 22px rgba(0,0,0,.28);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);'
        'border:1px solid rgba(255,255,255,.10);transition:transform .18s ease,box-shadow .18s ease;">'
        '<span style="display:inline-flex;width:16px;height:16px;flex:0 0 auto">'
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">'
        '<path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z" fill="#10b981"/></svg></span>'
        '<span>Сделано на <b style="font-weight:800">RoboWeb</b></span></a>'
        '<style>a[' + BADGE_MARKER + ']:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.34)!important}'
        '@media(max-width:520px){a[' + BADGE_MARKER + ']{font-size:11.5px;padding:6px 10px 6px 9px;right:10px;bottom:10px}}</style>'
    )
    lower = html.lower()
    idx = lower.rfind('</body>')
    if idx != -1:
        return html[:idx] + badge + html[idx:]
    return html + badge

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
                f"""SELECT p.id, p.title, p.description, p.html_content, COALESCE(u.plan, 'free')
                    FROM {schema}.projects p
                    LEFT JOIN {schema}.users u ON u.id = p.user_id
                    WHERE p.slug = %s AND p.status = 'published'""",
                (slug,)
            )
            row = cur.fetchone()
            if not row:
                return err('Сайт не найден или не опубликован', 404)

            project_id, title, description, html_content, owner_plan = row
            if not html_content:
                return err('Сайт не найден или не опубликован', 404)

            # Виральный бейдж «Сделано на RoboWeb» — только на бесплатном тарифе.
            # Платные тарифы (Премиум/Профи) публикуют без бейджа.
            if (owner_plan or 'free') == 'free':
                html_content = inject_badge(html_content)

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