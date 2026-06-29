import os
import json
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Admin-Key',
        'Access-Control-Max-Age': '86400',
    }

def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}

def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Заявки с сайтов: приём, список, смена статуса"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    schema = get_schema()
    body = json.loads(event.get('body') or '{}')

    # POST — приём новой заявки (публичный, вызывается с сайта пользователя)
    if method == 'POST' and body.get('action') != 'update_status':
        site_url = body.get('site_url', '')
        name = body.get('name', '').strip()
        phone = body.get('phone', '').strip()
        email = body.get('email', '').strip()
        message = body.get('message', '').strip()

        if not site_url:
            return err('site_url required')
        if not name and not phone and not email:
            return err('Укажите хотя бы имя, телефон или email')

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                # Ищем project_id по url
                cur.execute(f"SELECT id FROM {schema}.projects WHERE url = %s LIMIT 1", (site_url,))
                row = cur.fetchone()
                project_id = row[0] if row else None

                cur.execute(
                    f"INSERT INTO {schema}.site_leads (project_id, site_url, name, phone, email, message) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                    (project_id, site_url, name, phone, email, message)
                )
                lead_id = cur.fetchone()[0]
            conn.commit()
        finally:
            conn.close()

        return ok({'ok': True, 'id': lead_id})

    # GET — список заявок (требует авторизации)
    if method == 'GET':
        session_id = headers.get('x-session-id', '')
        admin_key = headers.get('x-admin-key', '')
        is_admin = admin_key and admin_key == os.environ.get('ADMIN_KEY', '')

        query_params = event.get('queryStringParameters') or {}
        status_filter = query_params.get('status', '')
        site_url = query_params.get('site_url', '')

        user_id = None
        if not is_admin:
            if not session_id:
                return err('Не авторизован', 401)
            conn = get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
                        (session_id,)
                    )
                    row = cur.fetchone()
                    if not row:
                        return err('Сессия истекла', 401)
                    user_id = row[0]
            finally:
                conn.close()

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                conditions = []
                params = []

                if is_admin and not site_url:
                    pass  # без фильтра — все заявки
                elif site_url:
                    conditions.append("sl.site_url = %s")
                    params.append(site_url)
                else:
                    conditions.append("p.user_id = %s")
                    params.append(user_id)

                if status_filter:
                    conditions.append("sl.status = %s")
                    params.append(status_filter)

                where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

                cur.execute(f"""
                    SELECT sl.id, sl.name, sl.phone, sl.email, sl.message,
                           sl.site_url, sl.status, sl.created_at, sl.project_id
                    FROM {schema}.site_leads sl
                    LEFT JOIN {schema}.projects p ON p.id = sl.project_id
                    {where}
                    ORDER BY sl.created_at DESC
                    LIMIT 200
                """, params)

                leads = []
                for r in cur.fetchall():
                    leads.append({
                        'id': r[0], 'name': r[1], 'phone': r[2], 'email': r[3],
                        'message': r[4], 'site': r[5], 'status': r[6],
                        'date': r[7].isoformat(), 'project_id': r[8],
                    })

                # Счётчики по статусам
                cur.execute(f"""
                    SELECT status, COUNT(*) FROM {schema}.site_leads sl
                    LEFT JOIN {schema}.projects p ON p.id = sl.project_id
                    {where.replace('WHERE', 'WHERE') if where else ''}
                    GROUP BY status
                """, params)
                counts = {r[0]: r[1] for r in cur.fetchall()}

        finally:
            conn.close()

        return ok({'leads': leads, 'counts': counts})

    # PUT — смена статуса заявки
    if method == 'PUT' or (method == 'POST' and body.get('action') == 'update_status'):
        session_id = headers.get('x-session-id', '')
        admin_key = headers.get('x-admin-key', '')
        is_admin = admin_key and admin_key == os.environ.get('ADMIN_KEY', '')

        lead_id = body.get('id')
        new_status = body.get('status', '')

        if not lead_id or new_status not in ('new', 'processed', 'rejected'):
            return err('Укажите id и корректный статус')

        if not is_admin and not session_id:
            return err('Не авторизован', 401)

        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {schema}.site_leads SET status = %s WHERE id = %s",
                    (new_status, lead_id)
                )
            conn.commit()
        finally:
            conn.close()

        return ok({'ok': True})

    return err('Not found', 404)
