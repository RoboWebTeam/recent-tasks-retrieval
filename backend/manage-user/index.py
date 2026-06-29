import os
import json
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
}

def ok(data):  return {'statusCode': 200, 'headers': CORS, 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': CORS, 'body': {'error': msg}}

def log_action(cur, schema, admin_note, user_id, action, meta='{}'):
    cur.execute(
        f"INSERT INTO {schema}.activity_log (user_id, action, entity, entity_id, meta) VALUES (NULL, %s, 'user', %s, %s)",
        (action, user_id, meta)
    )
    # Создаём уведомление для важных действий
    if action in ('delete_user', 'block_user', 'change_plan'):
        cur.execute(
            f"INSERT INTO {schema}.admin_notifications (type, title, body) VALUES (%s, %s, %s)",
            (action, admin_note, meta)
        )

def handler(event: dict, context) -> dict:
    """Управление пользователями и тарифами — только для администратора"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_key = headers.get('x-admin-key', '')
    if admin_key != os.environ.get('ADMIN_KEY', ''):
        return err('Unauthorized', 401)

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    user_id = body.get('user_id')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not action:
        return err('action обязателен')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:

            # --- Смена тарифа ---
            if action == 'change_plan':
                plan = body.get('plan', '')
                if not user_id or plan not in ('free', 'premium', 'pro'):
                    return err('user_id и plan (free/premium/pro) обязательны')
                cur.execute(f"SELECT name, plan FROM {schema}.users WHERE id = %s", (user_id,))
                row = cur.fetchone()
                if not row:
                    return err('Пользователь не найден', 404)
                old_plan = row[1]
                cur.execute(f"UPDATE {schema}.users SET plan = %s WHERE id = %s", (plan, user_id))
                meta = json.dumps({'user_id': user_id, 'old_plan': old_plan, 'new_plan': plan, 'name': row[0]})
                log_action(cur, schema, f'Тариф изменён: {row[0]} → {plan}', user_id, 'change_plan', meta)
                conn.commit()
                return ok({'ok': True, 'message': f'Тариф изменён на {plan}', 'plan': plan})

            # --- Блокировка ---
            elif action == 'block':
                if not user_id:
                    return err('user_id обязателен')
                cur.execute(f"SELECT name FROM {schema}.users WHERE id = %s", (user_id,))
                row = cur.fetchone()
                if not row:
                    return err('Пользователь не найден', 404)
                cur.execute(f"UPDATE {schema}.users SET blocked = true, blocked_at = NOW() WHERE id = %s", (user_id,))
                cur.execute(f"UPDATE {schema}.sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
                meta = json.dumps({'user_id': user_id, 'name': row[0]})
                log_action(cur, schema, f'Заблокирован: {row[0]}', user_id, 'block_user', meta)
                conn.commit()
                return ok({'ok': True, 'message': 'Пользователь заблокирован'})

            # --- Разблокировка ---
            elif action == 'unblock':
                if not user_id:
                    return err('user_id обязателен')
                cur.execute(f"UPDATE {schema}.users SET blocked = false, blocked_at = NULL WHERE id = %s", (user_id,))
                cur.execute(f"SELECT name FROM {schema}.users WHERE id = %s", (user_id,))
                row = cur.fetchone()
                meta = json.dumps({'user_id': user_id, 'name': row[0] if row else ''})
                log_action(cur, schema, f'Разблокирован: {row[0] if row else user_id}', user_id, 'unblock_user', meta)
                conn.commit()
                return ok({'ok': True, 'message': 'Пользователь разблокирован'})

            # --- Удаление ---
            elif action == 'delete':
                if not user_id:
                    return err('user_id обязателен')
                cur.execute(f"SELECT name, email FROM {schema}.users WHERE id = %s", (user_id,))
                row = cur.fetchone()
                if not row:
                    return err('Пользователь не найден', 404)
                meta = json.dumps({'user_id': user_id, 'name': row[0], 'email': row[1]})
                log_action(cur, schema, f'Удалён: {row[0]} ({row[1]})', user_id, 'delete_user', meta)
                cur.execute(f"UPDATE {schema}.sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
                cur.execute(f"UPDATE {schema}.projects SET user_id = NULL WHERE user_id = %s", (user_id,))
                cur.execute(f"UPDATE {schema}.users SET email = 'deleted_' || id || '@deleted', name = 'Удалён', blocked = true WHERE id = %s", (user_id,))
                conn.commit()
                return ok({'ok': True, 'message': 'Пользователь удалён'})

            else:
                return err(f'Неизвестный action: {action}')

    finally:
        conn.close()
