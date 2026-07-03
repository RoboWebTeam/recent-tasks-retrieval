import os
import json
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    method = event.get('httpMethod', 'POST')

    # --- GET: детали пользователя (проекты, домены, платежи, квота AI) ---
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        if not user_id:
            return err('user_id обязателен')

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, email, name, plan, created_at, blocked, blocked_at,
                               requests_used, requests_limit, requests_reset_at, energy_balance
                        FROM {schema}.users WHERE id = %s""",
                    (user_id,)
                )
                row = cur.fetchone()
                if not row:
                    return err('Пользователь не найден', 404)

                user_info = {
                    'id': row[0], 'email': row[1], 'name': row[2], 'plan': row[3],
                    'created_at': row[4].isoformat() if row[4] else None,
                    'blocked': row[5], 'blocked_at': row[6].isoformat() if row[6] else None,
                    'requests_used': row[7], 'requests_limit': row[8],
                    'requests_reset_at': row[9].isoformat() if row[9] else None,
                    'energy_balance': row[10],
                }

                cur.execute(
                    f"""SELECT id, title, description, status, slug, created_at, updated_at
                        FROM {schema}.projects WHERE user_id = %s ORDER BY updated_at DESC""",
                    (user_id,)
                )
                projects = [
                    {
                        'id': r[0], 'title': r[1], 'description': r[2], 'status': r[3],
                        'slug': r[4], 'created_at': r[5].isoformat() if r[5] else None,
                        'updated_at': r[6].isoformat() if r[6] else None,
                    }
                    for r in cur.fetchall()
                ]

                cur.execute(
                    f"""SELECT order_number, order_type, plan, energy_amount, billing_period,
                               amount, status, created_at, paid_at
                        FROM {schema}.orders WHERE user_id = %s ORDER BY created_at DESC""",
                    (user_id,)
                )
                orders = [
                    {
                        'order_number': r[0], 'order_type': r[1], 'plan': r[2], 'energy_amount': r[3],
                        'billing_period': r[4], 'amount': float(r[5]), 'status': r[6],
                        'created_at': r[7].isoformat() if r[7] else None,
                        'paid_at': r[8].isoformat() if r[8] else None,
                    }
                    for r in cur.fetchall()
                ]

                cur.execute(
                    f"""SELECT id, domain, status, is_primary, ssl_status, project_id, created_at, verified_at
                        FROM {schema}.domains WHERE user_id = %s ORDER BY created_at DESC""",
                    (user_id,)
                )
                domains = [
                    {
                        'id': r[0], 'domain': r[1], 'status': r[2], 'is_primary': r[3],
                        'ssl_status': r[4], 'project_id': r[5],
                        'created_at': r[6].isoformat() if r[6] else None,
                        'verified_at': r[7].isoformat() if r[7] else None,
                    }
                    for r in cur.fetchall()
                ]

                cur.execute(
                    f"""SELECT sl.id, sl.name, sl.phone, sl.email, sl.message, sl.site_url, sl.status, sl.created_at
                        FROM {schema}.site_leads sl
                        JOIN {schema}.projects p ON p.id = sl.project_id
                        WHERE p.user_id = %s ORDER BY sl.created_at DESC""",
                    (user_id,)
                )
                site_leads = [
                    {
                        'id': r[0], 'name': r[1], 'phone': r[2], 'email': r[3],
                        'message': r[4], 'site': r[5], 'status': r[6],
                        'created_at': r[7].isoformat() if r[7] else None,
                    }
                    for r in cur.fetchall()
                ]

            return ok({'user': user_info, 'projects': projects, 'orders': orders, 'domains': domains, 'site_leads': site_leads})
        finally:
            conn.close()

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    user_id = body.get('user_id')

    if not action:
        return err('action обязателен')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:

            # --- Смена тарифа ---
            if action == 'change_plan':
                plan = body.get('plan', '')
                valid_plans = ('free', 'premium', 'pro_60', 'pro_80', 'pro_200', 'pro_400', 'pro_800')
                if not user_id or plan not in valid_plans:
                    return err(f'user_id и plan ({"/".join(valid_plans)}) обязательны')
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

            # --- Удаление (полное, безвозвратное) ---
            elif action == 'delete':
                if not user_id:
                    return err('user_id обязателен')
                cur.execute(f"SELECT name, email FROM {schema}.users WHERE id = %s", (user_id,))
                row = cur.fetchone()
                if not row:
                    return err('Пользователь не найден', 404)
                meta = json.dumps({'user_id': user_id, 'name': row[0], 'email': row[1]})

                # Записываем факт удаления в лог/уведомления ДО удаления,
                # но сам activity_log должен пережить удаление пользователя —
                # поэтому его строки не трогаем, только отвязываем user_id
                log_action(cur, schema, f'Удалён: {row[0]} ({row[1]})', user_id, 'delete_user', meta)

                # Удаляем/отвязываем все зависимые данные в правильном порядке
                # (сначала дочерние таблицы, затем сами проекты и пользователя)
                cur.execute(f"""
                    DELETE FROM {schema}.project_db_rows
                    WHERE table_id IN (SELECT id FROM {schema}.project_db_tables WHERE user_id = %s)
                """, (user_id,))
                cur.execute(f"DELETE FROM {schema}.project_db_tables WHERE user_id = %s", (user_id,))
                cur.execute(f"DELETE FROM {schema}.project_secrets WHERE user_id = %s", (user_id,))
                cur.execute(f"DELETE FROM {schema}.domains WHERE user_id = %s", (user_id,))
                cur.execute(f"""
                    DELETE FROM {schema}.site_leads
                    WHERE project_id IN (SELECT id FROM {schema}.projects WHERE user_id = %s)
                """, (user_id,))
                cur.execute(f"DELETE FROM {schema}.site_files WHERE user_id = %s", (user_id,))
                cur.execute(f"DELETE FROM {schema}.sessions WHERE user_id = %s", (user_id,))
                cur.execute(f"UPDATE {schema}.activity_log SET user_id = NULL WHERE user_id = %s", (user_id,))
                cur.execute(f"DELETE FROM {schema}.projects WHERE user_id = %s", (user_id,))
                cur.execute(f"DELETE FROM {schema}.users WHERE id = %s", (user_id,))

                conn.commit()
                return ok({'ok': True, 'message': 'Пользователь и все его данные удалены безвозвратно'})

            else:
                return err(f'Неизвестный action: {action}')

    finally:
        conn.close()