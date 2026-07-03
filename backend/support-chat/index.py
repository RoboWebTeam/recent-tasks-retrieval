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


def get_conn(): return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user_by_session(cur, schema, session_id):
    if not session_id:
        return None
    cur.execute(
        f"""SELECT u.id, u.name, u.email FROM {schema}.sessions s
            JOIN {schema}.users u ON u.id = s.user_id
            WHERE s.id = %s AND s.expires_at > NOW()""",
        (session_id,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """Онлайн-чат поддержки: посетители сайта пишут сообщения, администратор отвечает из панели"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_key = headers.get('x-admin-key', '')
    session_id = headers.get('x-session-id', '')
    schema = get_schema()
    is_admin = admin_key != '' and admin_key == os.environ.get('ADMIN_KEY', '')

    conn = get_conn()
    try:
        with conn.cursor() as cur:

            # ───────────────────────── GET ─────────────────────────
            if method == 'GET':
                params = event.get('queryStringParameters') or {}

                # Админ: список всех бесед
                if is_admin and params.get('list') == 'conversations':
                    cur.execute(f"""
                        SELECT c.id, c.visitor_id, c.user_id, c.name, c.email, c.status,
                               c.unread_by_admin, c.created_at, c.last_message_at,
                               u.name, u.email
                        FROM {schema}.support_conversations c
                        LEFT JOIN {schema}.users u ON u.id = c.user_id
                        ORDER BY c.last_message_at DESC LIMIT 200
                    """)
                    convs = []
                    for r in cur.fetchall():
                        convs.append({
                            'id': r[0], 'visitor_id': r[1], 'user_id': r[2],
                            'name': r[9] or r[3] or ('Гость' if not r[2] else ''),
                            'email': r[10] or r[4],
                            'status': r[5], 'unread_by_admin': r[6],
                            'created_at': r[7].isoformat(), 'last_message_at': r[8].isoformat(),
                        })
                    cur.execute(f"SELECT COUNT(*) FROM {schema}.support_conversations WHERE unread_by_admin = true")
                    unread_total = cur.fetchone()[0]
                    return ok({'conversations': convs, 'unread_total': unread_total})

                # Админ: сообщения конкретной беседы
                if is_admin and params.get('conversation_id'):
                    conv_id = params.get('conversation_id')
                    cur.execute(f"""
                        SELECT id, sender, text, created_at FROM {schema}.support_messages
                        WHERE conversation_id = %s ORDER BY created_at ASC
                    """, (conv_id,))
                    msgs = [{'id': r[0], 'sender': r[1], 'text': r[2], 'created_at': r[3].isoformat()} for r in cur.fetchall()]
                    cur.execute(f"UPDATE {schema}.support_conversations SET unread_by_admin = false WHERE id = %s", (conv_id,))
                    conn.commit()
                    return ok({'messages': msgs})

                # Посетитель: получить свою беседу по visitor_id
                visitor_id = params.get('visitor_id', '')
                if not visitor_id:
                    return err('visitor_id обязателен')

                cur.execute(f"""
                    SELECT id, status, unread_by_visitor FROM {schema}.support_conversations
                    WHERE visitor_id = %s ORDER BY id DESC LIMIT 1
                """, (visitor_id,))
                row = cur.fetchone()
                if not row:
                    return ok({'conversation_id': None, 'messages': []})

                conv_id, status, unread = row
                cur.execute(f"""
                    SELECT id, sender, text, created_at FROM {schema}.support_messages
                    WHERE conversation_id = %s ORDER BY created_at ASC
                """, (conv_id,))
                msgs = [{'id': r[0], 'sender': r[1], 'text': r[2], 'created_at': r[3].isoformat()} for r in cur.fetchall()]

                if unread:
                    cur.execute(f"UPDATE {schema}.support_conversations SET unread_by_visitor = false WHERE id = %s", (conv_id,))
                    conn.commit()

                return ok({'conversation_id': conv_id, 'status': status, 'messages': msgs})

            body = json.loads(event.get('body') or '{}')

            # ───────────────────────── POST: отправка сообщения ─────────────────────────
            if method == 'POST':
                # Админ отвечает в существующей беседе
                if is_admin:
                    conv_id = body.get('conversation_id')
                    text = (body.get('text') or '').strip()
                    if not conv_id or not text:
                        return err('conversation_id и text обязательны')
                    cur.execute(
                        f"INSERT INTO {schema}.support_messages (conversation_id, sender, text) VALUES (%s, 'admin', %s) RETURNING id, created_at",
                        (conv_id, text)
                    )
                    r = cur.fetchone()
                    cur.execute(f"""
                        UPDATE {schema}.support_conversations
                        SET last_message_at = NOW(), unread_by_visitor = true
                        WHERE id = %s
                    """, (conv_id,))
                    conn.commit()
                    return ok({'message': {'id': r[0], 'sender': 'admin', 'text': text, 'created_at': r[1].isoformat()}})

                # Посетитель/пользователь отправляет сообщение
                visitor_id = (body.get('visitor_id') or '').strip()
                text = (body.get('text') or '').strip()
                name = (body.get('name') or '').strip()
                email = (body.get('email') or '').strip()
                if not visitor_id or not text:
                    return err('visitor_id и text обязательны')

                user_row = get_user_by_session(cur, schema, session_id)
                user_id = user_row[0] if user_row else None
                if user_row:
                    name = name or user_row[1]
                    email = email or user_row[2]

                cur.execute(f"SELECT id FROM {schema}.support_conversations WHERE visitor_id = %s ORDER BY id DESC LIMIT 1", (visitor_id,))
                row = cur.fetchone()

                if row:
                    conv_id = row[0]
                    cur.execute(f"""
                        UPDATE {schema}.support_conversations
                        SET last_message_at = NOW(), unread_by_admin = true, status = 'open',
                            user_id = COALESCE(user_id, %s), name = CASE WHEN name = '' THEN %s ELSE name END,
                            email = CASE WHEN email = '' THEN %s ELSE email END
                        WHERE id = %s
                    """, (user_id, name, email, conv_id))
                else:
                    cur.execute(f"""
                        INSERT INTO {schema}.support_conversations (visitor_id, user_id, name, email)
                        VALUES (%s, %s, %s, %s) RETURNING id
                    """, (visitor_id, user_id, name, email))
                    conv_id = cur.fetchone()[0]

                cur.execute(
                    f"INSERT INTO {schema}.support_messages (conversation_id, sender, text) VALUES (%s, 'visitor', %s) RETURNING id, created_at",
                    (conv_id, text)
                )
                r = cur.fetchone()
                conn.commit()
                return ok({'conversation_id': conv_id, 'message': {'id': r[0], 'sender': 'visitor', 'text': text, 'created_at': r[1].isoformat()}})

            # ───────────────────────── PUT: изменить статус беседы (только админ) ─────────────────────────
            if method == 'PUT':
                if not is_admin:
                    return err('Forbidden', 403)
                conv_id = body.get('conversation_id')
                status = body.get('status')
                if not conv_id or status not in ('open', 'closed'):
                    return err('conversation_id и status (open/closed) обязательны')
                cur.execute(f"UPDATE {schema}.support_conversations SET status = %s WHERE id = %s", (status, conv_id))
                conn.commit()
                return ok({'ok': True})

            return err('Метод не поддерживается', 405)
    finally:
        conn.close()
