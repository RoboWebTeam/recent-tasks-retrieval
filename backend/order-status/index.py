import os
import psycopg2

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}

def handler(event: dict, context) -> dict:
    """Проверяет статус заказа по номеру — используется на странице результата оплаты ЮKassa"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    params = event.get('queryStringParameters') or {}
    order_number = params.get('order_number', '').strip()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not order_number:
        return err('Укажите номер заказа')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT status, plan, billing_period, amount FROM {schema}.orders WHERE order_number = %s",
                (order_number,)
            )
            row = cur.fetchone()
            if not row:
                return err('Заказ не найден', 404)

            status, plan, billing_period, amount = row
            return ok({
                'status': status,
                'plan': plan,
                'billing_period': billing_period,
                'amount': float(amount),
            })
    finally:
        conn.close()
