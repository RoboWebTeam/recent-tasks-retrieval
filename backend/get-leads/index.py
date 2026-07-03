import os
import json
import psycopg2


def is_rate_limited(conn, schema: str, key: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
    """
    Проверяет, не превышен ли лимит неудачных попыток. Возвращает True если лимит превышен (доступ запрещён).
    Fail-closed: при ошибке БД — блокируем (безопаснее).
    """
    window_minutes = int(window_minutes)
    max_attempts = int(max_attempts)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"DELETE FROM {schema}.rate_limits WHERE key = %s AND created_at < NOW() - make_interval(mins => %s)",
                (key, window_minutes)
            )
            cur.execute(
                f"SELECT COUNT(*) FROM {schema}.rate_limits WHERE key = %s",
                (key,)
            )
            count = cur.fetchone()[0]
            conn.commit()
            return count >= max_attempts
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        return True


def record_failed_attempt(conn, schema: str, key: str):
    try:
        with conn.cursor() as cur:
            cur.execute(f"INSERT INTO {schema}.rate_limits (key) VALUES (%s)", (key,))
        conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass


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

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_key = (
        headers.get('x-admin-key') or
        headers.get('X-Admin-Key') or
        headers.get('X-ADMIN-KEY') or
        ''
    )
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp', 'unknown')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    rate_key = f'admin_login:{ip}'

    # Rate limit: не более 5 неудачных попыток входа в админку за 15 минут с одного IP
    if is_rate_limited(conn, schema, rate_key, max_attempts=5, window_minutes=15):
        conn.close()
        return {
            'statusCode': 429,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': {'error': 'Слишком много попыток входа. Попробуйте через 15 минут.'}
        }

    if admin_key != os.environ.get('ADMIN_KEY', ''):
        record_failed_attempt(conn, schema, rate_key)
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': {'error': 'Unauthorized'}
        }

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, email, created_at FROM {schema}.leads ORDER BY created_at DESC"
            )
            lead_rows = cur.fetchall()

            cur.execute(
                f"SELECT id, email, name, plan, created_at, blocked FROM {schema}.users ORDER BY created_at DESC"
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
            'projects_count': project_counts.get(r[0], 0),
            'blocked': r[5]
        }
        for r in user_rows
    ]

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': {'leads': leads, 'total': len(leads), 'users': users, 'users_total': len(users)}
    }