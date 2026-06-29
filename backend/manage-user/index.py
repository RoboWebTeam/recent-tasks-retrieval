import os
import json
import psycopg2


def handler(event: dict, context) -> dict:
    """Удаление или блокировка пользователя — только для администратора"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    headers = event.get('headers', {})
    admin_key = (
        headers.get('x-admin-key') or
        headers.get('X-Admin-Key') or
        headers.get('X-ADMIN-KEY') or
        ''
    )
    if admin_key != os.environ.get('ADMIN_KEY', ''):
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': {'error': 'Unauthorized'}
        }

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')   # 'block' | 'unblock' | 'delete'
    user_id = body.get('user_id')

    if not action or not user_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': {'error': 'action и user_id обязательны'}
        }

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            if action == 'delete':
                cur.execute(f"DELETE FROM {schema}.sessions WHERE user_id = %s", (user_id,))
                cur.execute(f"DELETE FROM {schema}.projects WHERE user_id = %s", (user_id,))
                cur.execute(f"DELETE FROM {schema}.users WHERE id = %s", (user_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': {'ok': True, 'message': 'Пользователь удалён'}
                }
            elif action == 'block':
                cur.execute(
                    f"UPDATE {schema}.users SET blocked = true, blocked_at = NOW() WHERE id = %s",
                    (user_id,)
                )
                cur.execute(f"DELETE FROM {schema}.sessions WHERE user_id = %s", (user_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': {'ok': True, 'message': 'Пользователь заблокирован'}
                }
            elif action == 'unblock':
                cur.execute(
                    f"UPDATE {schema}.users SET blocked = false, blocked_at = NULL WHERE id = %s",
                    (user_id,)
                )
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': {'ok': True, 'message': 'Пользователь разблокирован'}
                }
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': {'error': f'Неизвестный action: {action}'}
                }
    finally:
        conn.close()
