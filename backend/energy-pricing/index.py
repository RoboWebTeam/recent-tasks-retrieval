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
    """Цены пакетов энергии (докупка AI-запросов) — публичное чтение, редактирование только администратором"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = get_schema()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            if method == 'GET':
                cur.execute(
                    f"SELECT package_code, requests, price FROM {schema}.energy_pricing ORDER BY sort_order"
                )
                packages = [{'code': r[0], 'requests': r[1], 'price': float(r[2])} for r in cur.fetchall()]
                return ok({'packages': packages})

            if method == 'PUT':
                headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
                admin_key = headers.get('x-admin-key', '')
                if admin_key != os.environ.get('ADMIN_KEY', ''):
                    return err('Unauthorized', 401)

                body = json.loads(event.get('body') or '{}')
                packages = body.get('packages', [])
                if not isinstance(packages, list) or not packages:
                    return err('Укажите список packages')

                for p in packages:
                    package_code = p.get('code', '')
                    price = p.get('price')
                    if not package_code or price is None:
                        return err(f'Некорректные данные для пакета: {p}')
                    cur.execute(
                        f"UPDATE {schema}.energy_pricing SET price = %s, updated_at = NOW() WHERE package_code = %s",
                        (price, package_code)
                    )
                conn.commit()

                cur.execute(
                    f"SELECT package_code, requests, price FROM {schema}.energy_pricing ORDER BY sort_order"
                )
                updated = [{'code': r[0], 'requests': r[1], 'price': float(r[2])} for r in cur.fetchall()]
                return ok({'packages': updated})

            return err('Метод не поддерживается', 405)
    finally:
        conn.close()
