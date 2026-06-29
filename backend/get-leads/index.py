import os
import json
import psycopg2


def handler(event: dict, context) -> dict:
    """Возвращает список заявок из БД для страницы администратора"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    admin_key = event.get('headers', {}).get('x-admin-key', '')
    if admin_key != os.environ.get('ADMIN_KEY', ''):
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': {'error': 'Unauthorized'}
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, email, created_at FROM {schema}.leads ORDER BY created_at DESC"
            )
            lead_rows = cur.fetchall()

            cur.execute(
                f"SELECT id, email, name, plan, created_at FROM {schema}.users ORDER BY created_at DESC"
            )
            user_rows = cur.fetchall()

            cur.execute(f"SELECT user_id, COUNT(*) FROM {schema}.projects GROUP BY user_id")
            project_counts = {r[0]: r[1] for r in cur.fetchall()}

    finally:
        conn.close()

    leads = [
        {'id': r[0], 'email': r[1], 'created_at': r[2].isoformat()}
        for r in lead_rows
    ]

    users = [
        {
            'id': r[0], 'email': r[1], 'name': r[2], 'plan': r[3],
            'created_at': r[4].isoformat(),
            'projects_count': project_counts.get(r[0], 0)
        }
        for r in user_rows
    ]

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': {'leads': leads, 'total': len(leads), 'users': users, 'users_total': len(users)}
    }