import os
import json
import psycopg2


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
        'Access-Control-Max-Age': '86400',
    }


def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    """Цены тарифов «Профи» (по количеству запросов) — публичное чтение, редактирование только администратором"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = get_schema()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            if method == 'GET':
                cur.execute(
                    f"SELECT plan_code, requests, price FROM {schema}.plan_pricing ORDER BY sort_order"
                )
                plans = [{'plan_code': r[0], 'requests': r[1], 'price': float(r[2])} for r in cur.fetchall()]
                return ok({'plans': plans})

            if method == 'PUT':
                headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
                admin_key = headers.get('x-admin-key', '')
                if admin_key != os.environ.get('ADMIN_KEY', ''):
                    return err('Unauthorized', 401)

                body = json.loads(event.get('body') or '{}')
                plans = body.get('plans', [])
                if not isinstance(plans, list) or not plans:
                    return err('Укажите список plans')

                for p in plans:
                    plan_code = p.get('plan_code', '')
                    price = p.get('price')
                    if not plan_code or price is None:
                        return err(f'Некорректные данные для плана: {p}')
                    cur.execute(
                        f"UPDATE {schema}.plan_pricing SET price = %s, updated_at = NOW() WHERE plan_code = %s",
                        (price, plan_code)
                    )
                conn.commit()

                cur.execute(
                    f"SELECT plan_code, requests, price FROM {schema}.plan_pricing ORDER BY sort_order"
                )
                updated = [{'plan_code': r[0], 'requests': r[1], 'price': float(r[2])} for r in cur.fetchall()]
                return ok({'plans': updated})

            return err('Метод не поддерживается', 405)
    finally:
        conn.close()
