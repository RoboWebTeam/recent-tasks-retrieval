import os
import json
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

def ok(data): return {'statusCode': 200, 'headers': CORS, 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': CORS, 'body': {'error': msg}}

def get_schema(): return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Лог действий и уведомления администратора"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_key = headers.get('x-admin-key', '')
    session_id = headers.get('x-session-id', '')
    schema = get_schema()
    query = event.get('queryStringParameters') or {}

    is_admin = admin_key == os.environ.get('ADMIN_KEY', '') and admin_key != ''

    # --- GET: список лога / уведомлений ---
    if method == 'GET':
        entity = query.get('entity', 'log')  # 'log' | 'notifications'
        limit = min(int(query.get('limit', 100)), 500)
        action_filter = query.get('action', '')

        # Если не админ — читаем свой лог по сессии
        user_id = None
        if not is_admin:
            if not session_id:
                return err('Не авторизован', 401)
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
                    row = cur.fetchone()
                    if not row:
                        return err('Сессия истекла', 401)
                    user_id = row[0]
            finally:
                conn.close()

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            with conn.cursor() as cur:

                if entity == 'notifications':
                    if not is_admin:
                        return err('Forbidden', 403)
                    cur.execute(f"""
                        SELECT id, type, title, body, link, is_read, created_at
                        FROM {schema}.admin_notifications
                        ORDER BY created_at DESC LIMIT %s
                    """, (limit,))
                    notifs = [{'id': r[0], 'type': r[1], 'title': r[2], 'body': r[3], 'link': r[4], 'is_read': r[5], 'created_at': r[6].isoformat()} for r in cur.fetchall()]
                    cur.execute(f"SELECT COUNT(*) FROM {schema}.admin_notifications WHERE is_read = false")
                    unread = cur.fetchone()[0]
                    return ok({'notifications': notifs, 'unread': unread})

                # activity log
                conditions = []
                params = []
                if user_id and not is_admin:
                    conditions.append("al.user_id = %s")
                    params.append(user_id)
                if action_filter:
                    conditions.append("al.action = %s")
                    params.append(action_filter)

                where = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''
                params.append(limit)

                cur.execute(f"""
                    SELECT al.id, al.user_id, u.name, u.email, al.action, al.entity,
                           al.entity_id, al.meta, al.ip, al.created_at
                    FROM {schema}.activity_log al
                    LEFT JOIN {schema}.users u ON u.id = al.user_id
                    {where}
                    ORDER BY al.created_at DESC LIMIT %s
                """, params)

                logs = []
                for r in cur.fetchall():
                    try:
                        meta = json.loads(r[7]) if r[7] else {}
                    except Exception:
                        meta = {}
                    logs.append({
                        'id': r[0], 'user_id': r[1], 'user_name': r[2] or '—',
                        'user_email': r[3] or '—', 'action': r[4], 'entity': r[5],
                        'entity_id': r[6], 'meta': meta, 'ip': r[8],
                        'created_at': r[9].isoformat(),
                    })

                # Сводка по действиям
                cur.execute(f"""
                    SELECT action, COUNT(*) as cnt FROM {schema}.activity_log
                    {where.replace('LIMIT %s', '') if where else ''}
                    GROUP BY action ORDER BY cnt DESC LIMIT 10
                """, params[:-1])
                summary = [{'action': r[0], 'count': r[1]} for r in cur.fetchall()]

                return ok({'logs': logs, 'summary': summary})

        finally:
            conn.close()

    # --- POST: записать событие (вызывается из других бэкендов или фронтенда) ---
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', '')
        entity = body.get('entity', '')
        entity_id = body.get('entity_id')
        meta = json.dumps(body.get('meta', {}))
        ip = (event.get('requestContext') or {}).get('identity', {}).get('sourceIp', '')

        # Определяем user_id
        user_id = None
        if session_id:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
                    row = cur.fetchone()
                    if row:
                        user_id = row[0]
            finally:
                conn.close()

        if not action:
            return err('action обязателен')

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {schema}.activity_log (user_id, action, entity, entity_id, meta, ip) VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_id, action, entity, entity_id, meta, ip)
                )
            conn.commit()
        finally:
            conn.close()

        return ok({'ok': True})

    # --- PUT: пометить уведомления прочитанными ---
    if method == 'PUT':
        if not is_admin:
            return err('Forbidden', 403)
        body = json.loads(event.get('body') or '{}')
        notif_id = body.get('id')  # None = все

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            with conn.cursor() as cur:
                if notif_id:
                    cur.execute(f"UPDATE {schema}.admin_notifications SET is_read = true WHERE id = %s", (notif_id,))
                else:
                    cur.execute(f"UPDATE {schema}.admin_notifications SET is_read = true WHERE is_read = false")
            conn.commit()
        finally:
            conn.close()

        return ok({'ok': True})

    return err('Not found', 404)
