import os
import json
import base64
import psycopg2
import boto3

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

IMAGE_CONTENT_TYPES = {
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'webp': 'image/webp', 'gif': 'image/gif',
}


def ok(data): return {'statusCode': 200, 'headers': CORS, 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': CORS, 'body': {'error': msg}}


def get_schema(): return os.environ.get('MAIN_DB_SCHEMA', 'public')


def get_conn(): return psycopg2.connect(os.environ['DATABASE_URL'])


S3_BUCKET = 'roboweb'


def get_s3():
    # Собственное S3-хранилище на reg.ru (Рег.облако) вместо встроенного хранилища платформы.
    return boto3.client(
        's3',
        endpoint_url='https://s3.regru.cloud',
        aws_access_key_id=os.environ['REG_S3_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['REG_S3_SECRET_ACCESS_KEY'],
    )


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


def get_auto_reply_settings(cur, schema):
    cur.execute(f"SELECT key, value FROM {schema}.support_settings")
    settings = dict(cur.fetchall())
    return {
        'enabled': settings.get('auto_reply_enabled', 'false') == 'true',
        'text': settings.get('auto_reply_text', ''),
        'start_hour': int(settings.get('work_start_hour', '9')),
        'end_hour': int(settings.get('work_end_hour', '20')),
    }


def is_within_work_hours(start_hour: int, end_hour: int) -> bool:
    from datetime import datetime, timezone, timedelta
    moscow_time = datetime.now(timezone.utc) + timedelta(hours=3)
    return start_hour <= moscow_time.hour < end_hour


def upload_chat_file(file_name: str, file_content_b64: str, visitor_id: str):
    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''
    content_type = IMAGE_CONTENT_TYPES.get(ext, 'application/octet-stream')
    file_kind = 'image' if ext in IMAGE_CONTENT_TYPES else 'file'
    raw = base64.b64decode(file_content_b64)
    safe_name = ''.join(c for c in file_name if c.isalnum() or c in ('-', '_', '.')) or 'file'
    key = f"support-chat/{visitor_id}/{safe_name}"
    s3 = get_s3()
    # ACL='public-read' обязателен: без него reg.ru отдаёт 403 при попытке
    # открыть файл по прямой ссылке, даже если сам bucket публичный.
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=raw, ContentType=content_type, ACL='public-read')
    cdn_url = f"https://s3.regru.cloud/{S3_BUCKET}/{key}"
    return cdn_url, file_kind, safe_name


def message_to_dict(r):
    return {
        'id': r[0], 'sender': r[1], 'text': r[2], 'created_at': r[3].isoformat(),
        'file_url': r[4], 'file_type': r[5], 'file_name': r[6],
    }


def handler(event: dict, context) -> dict:
    """Онлайн-чат поддержки: посетители сайта пишут сообщения (в т.ч. с файлами),
    администратор отвечает из панели, использует шаблоны, видит проекты пользователя.
    Поддерживает автоответ в нерабочее время."""

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

                # Админ: настройки автоответа
                if is_admin and params.get('settings') == '1':
                    s = get_auto_reply_settings(cur, schema)
                    return ok({'settings': s})

                # Админ: шаблоны быстрых ответов
                if is_admin and params.get('list') == 'quick-replies':
                    cur.execute(f"SELECT id, title, text FROM {schema}.support_quick_replies ORDER BY id")
                    replies = [{'id': r[0], 'title': r[1], 'text': r[2]} for r in cur.fetchall()]
                    return ok({'quick_replies': replies})

                # Админ: проекты и тариф пользователя, привязанного к беседе
                if is_admin and params.get('user_projects'):
                    user_id = params.get('user_projects')
                    cur.execute(f"SELECT plan, email, name FROM {schema}.users WHERE id = %s", (user_id,))
                    urow = cur.fetchone()
                    if not urow:
                        return ok({'user': None, 'projects': []})
                    cur.execute(f"""
                        SELECT id, title, status, slug FROM {schema}.projects
                        WHERE user_id = %s ORDER BY updated_at DESC LIMIT 10
                    """, (user_id,))
                    projects = [{'id': r[0], 'title': r[1], 'status': r[2], 'slug': r[3]} for r in cur.fetchall()]
                    return ok({'user': {'plan': urow[0], 'email': urow[1], 'name': urow[2]}, 'projects': projects})

                # Админ: список всех бесед (с поиском и фильтром непрочитанных)
                if is_admin and params.get('list') == 'conversations':
                    search = (params.get('search') or '').strip().lower()
                    unread_only = params.get('unread_only') == '1'

                    conditions = []
                    query_params = []
                    if search:
                        conditions.append("(LOWER(COALESCE(u.name, c.name)) LIKE %s OR LOWER(COALESCE(u.email, c.email)) LIKE %s)")
                        query_params.extend([f'%{search}%', f'%{search}%'])
                    if unread_only:
                        conditions.append("c.unread_by_admin = true")
                    where = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''

                    cur.execute(f"""
                        SELECT c.id, c.visitor_id, c.user_id, c.name, c.email, c.status,
                               c.unread_by_admin, c.created_at, c.last_message_at,
                               u.name, u.email
                        FROM {schema}.support_conversations c
                        LEFT JOIN {schema}.users u ON u.id = c.user_id
                        {where}
                        ORDER BY c.last_message_at DESC LIMIT 200
                    """, query_params)
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
                        SELECT id, sender, text, created_at, file_url, file_type, file_name
                        FROM {schema}.support_messages
                        WHERE conversation_id = %s ORDER BY created_at ASC
                    """, (conv_id,))
                    msgs = [message_to_dict(r) for r in cur.fetchall()]
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
                    SELECT id, sender, text, created_at, file_url, file_type, file_name
                    FROM {schema}.support_messages
                    WHERE conversation_id = %s ORDER BY created_at ASC
                """, (conv_id,))
                msgs = [message_to_dict(r) for r in cur.fetchall()]

                if unread:
                    cur.execute(f"UPDATE {schema}.support_conversations SET unread_by_visitor = false WHERE id = %s", (conv_id,))
                    conn.commit()

                return ok({'conversation_id': conv_id, 'status': status, 'messages': msgs})

            body = json.loads(event.get('body') or '{}')

            # ───────────────────────── POST ─────────────────────────
            if method == 'POST':
                # Админ: создать/обновить/удалить шаблон быстрого ответа
                if is_admin and body.get('action') == 'save_quick_reply':
                    title = (body.get('title') or '').strip()
                    text = (body.get('text') or '').strip()
                    reply_id = body.get('id')
                    if not title or not text:
                        return err('title и text обязательны')
                    if reply_id:
                        cur.execute(f"UPDATE {schema}.support_quick_replies SET title = %s, text = %s WHERE id = %s", (title, text, reply_id))
                    else:
                        cur.execute(f"INSERT INTO {schema}.support_quick_replies (title, text) VALUES (%s, %s) RETURNING id", (title, text))
                    conn.commit()
                    return ok({'ok': True})

                if is_admin and body.get('action') == 'delete_quick_reply':
                    reply_id = body.get('id')
                    if not reply_id:
                        return err('id обязателен')
                    cur.execute(f"DELETE FROM {schema}.support_quick_replies WHERE id = %s", (reply_id,))
                    conn.commit()
                    return ok({'ok': True})

                # Админ: сохранить настройки автоответа
                if is_admin and body.get('action') == 'save_settings':
                    updates = {
                        'auto_reply_enabled': 'true' if body.get('enabled') else 'false',
                        'auto_reply_text': body.get('text', ''),
                        'work_start_hour': str(body.get('start_hour', 9)),
                        'work_end_hour': str(body.get('end_hour', 20)),
                    }
                    for k, v in updates.items():
                        cur.execute(f"""
                            INSERT INTO {schema}.support_settings (key, value) VALUES (%s, %s)
                            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                        """, (k, v))
                    conn.commit()
                    return ok({'ok': True})

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
                    return ok({'message': {'id': r[0], 'sender': 'admin', 'text': text, 'created_at': r[1].isoformat(), 'file_url': None, 'file_type': None, 'file_name': None}})

                # Посетитель/пользователь отправляет сообщение (текст и/или файл)
                visitor_id = (body.get('visitor_id') or '').strip()
                text = (body.get('text') or '').strip()
                name = (body.get('name') or '').strip()
                email = (body.get('email') or '').strip()
                file_name_in = (body.get('file_name') or '').strip()
                file_content_b64 = body.get('file_content', '')

                if not visitor_id or (not text and not file_content_b64):
                    return err('visitor_id и (text или file) обязательны')

                file_url = file_type = file_name = None
                if file_content_b64 and file_name_in:
                    file_url, file_type, file_name = upload_chat_file(file_name_in, file_content_b64, visitor_id)

                user_row = get_user_by_session(cur, schema, session_id)
                user_id = user_row[0] if user_row else None
                if user_row:
                    name = name or user_row[1]
                    email = email or user_row[2]

                cur.execute(f"SELECT id FROM {schema}.support_conversations WHERE visitor_id = %s ORDER BY id DESC LIMIT 1", (visitor_id,))
                row = cur.fetchone()

                is_new_conversation = row is None

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
                    f"""INSERT INTO {schema}.support_messages (conversation_id, sender, text, file_url, file_type, file_name)
                        VALUES (%s, 'visitor', %s, %s, %s, %s) RETURNING id, created_at""",
                    (conv_id, text, file_url, file_type, file_name)
                )
                r = cur.fetchone()

                # Автоответ в нерабочее время — только для первого сообщения в беседе
                auto_reply_sent = None
                if is_new_conversation:
                    settings = get_auto_reply_settings(cur, schema)
                    if settings['enabled'] and not is_within_work_hours(settings['start_hour'], settings['end_hour']) and settings['text']:
                        cur.execute(
                            f"INSERT INTO {schema}.support_messages (conversation_id, sender, text) VALUES (%s, 'admin', %s) RETURNING id, created_at",
                            (conv_id, settings['text'])
                        )
                        ar = cur.fetchone()
                        auto_reply_sent = {'id': ar[0], 'sender': 'admin', 'text': settings['text'], 'created_at': ar[1].isoformat(), 'file_url': None, 'file_type': None, 'file_name': None}

                conn.commit()
                result = {
                    'conversation_id': conv_id,
                    'message': {'id': r[0], 'sender': 'visitor', 'text': text, 'created_at': r[1].isoformat(), 'file_url': file_url, 'file_type': file_type, 'file_name': file_name},
                }
                if auto_reply_sent:
                    result['auto_reply'] = auto_reply_sent
                return ok(result)

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