"""YooKassa payment creation handler."""
import json
import os
import re
import uuid
import base64
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2


# =============================================================================
# VALIDATION
# =============================================================================

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
MIN_AMOUNT = 1.00  # Minimum 1 RUB
MAX_AMOUNT = 1_000_000.00  # Maximum 1M RUB


def is_valid_email(email: str) -> bool:
    """Validate email format."""
    return bool(EMAIL_REGEX.match(email))


def is_valid_url(url: str) -> bool:
    """Validate URL (must be https)."""
    return url.startswith('https://')

# =============================================================================
# CONSTANTS
# =============================================================================

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}


# =============================================================================
# DATABASE
# =============================================================================

def get_connection():
    """Get database connection."""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


# Цена Премиума фиксирована на сервере (в plan_pricing только pro-*). Держать в синхроне
# с Pricing.tsx (handleSelectPlan('premium', 990)).
PREMIUM_PRICE = 990.0
PRO_CODES = ('pro_60', 'pro_80', 'pro_200', 'pro_400', 'pro_800')


def resolve_server_amount(cur, sp: str, order_type: str, plan: str, energy_amount):
    """Авторитетная сумма заказа — СО СТОРОНЫ СЕРВЕРА, а не от клиента. Иначе можно оплатить тариф
    или энергию за 1₽ (сумма приходила из тела запроса и не сверялась с ценой). Возвращает
    (amount: float, energy_amount: int|None) либо None, если заказ некорректен (неизвестный
    план/пакет). Для энергии пакет опознаём по количеству единиц (energy_amount) в energy_pricing."""
    if order_type == 'energy':
        try:
            ea = int(energy_amount)
        except (TypeError, ValueError):
            return None
        cur.execute(f"SELECT price FROM {sp}energy_pricing WHERE requests = %s", (ea,))
        row = cur.fetchone()
        if not row:
            return None
        return float(row[0]), ea
    # Покупка тарифа
    if plan == 'premium':
        return PREMIUM_PRICE, None
    if plan in PRO_CODES:
        cur.execute(f"SELECT price FROM {sp}plan_pricing WHERE plan_code = %s", (plan,))
        row = cur.fetchone()
        if not row:
            return None
        return float(row[0]), None
    return None  # неизвестный план / нельзя купить (например free)


# =============================================================================
# YOOKASSA API
# =============================================================================

def create_yookassa_payment(
    shop_id: str,
    secret_key: str,
    amount: float,
    description: str,
    return_url: str,
    customer_email: str,
    cart_items: list,
    metadata: dict = None
) -> dict:
    """Create payment via YooKassa API with receipt (54-FZ)."""
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    idempotence_key = str(uuid.uuid4())

    # Build receipt items for 54-FZ
    receipt_items = []
    for item in cart_items:
        qty = int(item.get('quantity', 1))
        price = float(item.get('price', 0))
        receipt_items.append({
            "description": str(item.get('name', 'Товар'))[:128],
            "quantity": f"{qty:.3f}",
            "amount": {
                "value": f"{price * qty:.2f}",
                "currency": "RUB"
            },
            "vat_code": 1,
            "payment_subject": "commodity",
            "payment_mode": "full_payment"
        })

    payload = {
        "amount": {
            "value": f"{amount:.2f}",
            "currency": "RUB"
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": return_url
        },
        "description": description,
        "receipt": {
            "customer": {
                "email": customer_email
            },
            "items": receipt_items
        }
    }

    if metadata:
        payload["metadata"] = metadata

    request = Request(
        YOOKASSA_API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode())


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """Handle payment creation request."""
    # CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Parse body
    body = event.get('body', '{}')
    if event.get('isBase64Encoded'):
        body = base64.b64decode(body).decode('utf-8')

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Invalid JSON'})
        }

    # Validate required fields
    amount = data.get('amount', 0)
    user_name = data.get('user_name', '').strip()
    user_email = data.get('user_email', '').strip()
    user_phone = data.get('user_phone', '').strip()
    return_url = data.get('return_url', '').strip()
    description = data.get('description', 'Оплата заказа')
    cart_items = data.get('cart_items', [])
    plan = data.get('plan', '')
    billing_period = data.get('billing_period', '')
    user_id = data.get('user_id')
    order_type = data.get('order_type', 'plan')
    energy_amount = data.get('energy_amount')

    if amount < MIN_AMOUNT or amount > MAX_AMOUNT:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': f'Amount must be between {MIN_AMOUNT} and {MAX_AMOUNT} RUB'})
        }

    if not user_email or not is_valid_email(user_email):
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Valid email is required'})
        }

    if not return_url or not is_valid_url(return_url):
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'return_url must be a valid HTTPS URL'})
        }

    # If no cart_items, create a single item with total amount
    if not cart_items:
        cart_items = [{
            'id': '1',
            'name': description or 'Оплата',
            'price': amount,
            'quantity': 1
        }]

    # Get credentials. Убираем случайные пробелы/переносы строк, которые часто попадают
    # при копировании ключей и ломают авторизацию ("Login has illegal format").
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '').strip()
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '').strip()

    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': 'YooKassa credentials not configured'})
        }

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()

        # СЕРВЕРНАЯ СВЕРКА СУММЫ: сумму и объём берём авторитетно из БД, а НЕ из тела запроса,
        # иначе клиент мог оплатить тариф/энергию за 1₽. Клиентские amount/energy_amount/cart_items
        # игнорируем. Некорректный заказ (неизвестный тариф/пакет) — отклоняем.
        resolved = resolve_server_amount(cur, S, order_type, plan, energy_amount)
        if resolved is None:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Некорректный заказ: неизвестный тариф или пакет энергии'})
            }
        amount, energy_amount = resolved
        # Чек (54-ФЗ) обязан совпадать с суммой платежа — пересобираем позиции по авторитетной сумме.
        cart_items = [{'id': '1', 'name': (description or 'Оплата')[:120], 'price': amount, 'quantity': 1}]

        # Generate order number
        order_number = f"YK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

        # Create order in DB
        cur.execute(f"""
            INSERT INTO {S}orders
            (order_number, user_id, plan, billing_period, user_name, user_email, user_phone, amount, status, order_type, energy_amount, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s, %s, %s, %s)
            RETURNING id
        """, (order_number, user_id, plan, billing_period, user_name, user_email, user_phone, amount, order_type, energy_amount, now, now))

        order_id = cur.fetchone()[0]

        # Insert cart items
        for item in cart_items:
            cur.execute(f"""
                INSERT INTO {S}order_items
                (order_id, product_id, product_name, product_price, quantity, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                order_id,
                str(item.get('id', '')),
                item.get('name', ''),
                item.get('price', 0),
                item.get('quantity', 1),
                now
            ))

        # Create YooKassa payment
        metadata = {
            "order_id": str(order_id),
            "order_number": order_number
        }

        payment_response = create_yookassa_payment(
            shop_id=shop_id,
            secret_key=secret_key,
            amount=amount,
            description=f"{description} ({order_number})",
            return_url=return_url,
            customer_email=user_email,
            cart_items=cart_items,
            metadata=metadata
        )

        payment_id = payment_response.get('id')
        confirmation_url = payment_response.get('confirmation', {}).get('confirmation_url', '')

        # Update order with payment info
        cur.execute(f"""
            UPDATE {S}orders
            SET yookassa_payment_id = %s, payment_url = %s, updated_at = %s
            WHERE id = %s
        """, (payment_id, confirmation_url, now, order_id))

        conn.commit()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'payment_url': confirmation_url,
                'payment_id': payment_id,
                'order_id': order_id,
                'order_number': order_number
            })
        }

    except HTTPError as e:
        conn.rollback()
        error_body = e.read().decode() if e.fp else str(e)
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': f'YooKassa API error: {error_body}'})
        }
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        conn.close()