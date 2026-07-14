"""YooKassa webhook handler for payment notifications."""
import json
import os
import sys
import base64
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2

# =============================================================================
# CONSTANTS
# =============================================================================

HEADERS = {
    'Content-Type': 'application/json'
}

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

# Лимиты тарифов — единый источник backend/_shared/plans.py (общий с generate-site и auth).
# КРИТИЧНО: используются при выставлении requests_limit ПОСЛЕ ОПЛАТЫ. Путь до backend/ ищем
# «вверх» до папки с _shared (функция лежит глубоко: extensions/yookassa/yookassa-webhook).
_bd = os.path.dirname(os.path.abspath(__file__))
while _bd != os.path.dirname(_bd) and not os.path.isdir(os.path.join(_bd, '_shared')):
    _bd = os.path.dirname(_bd)
if _bd not in sys.path:
    sys.path.insert(0, _bd)
from _shared.plans import PLAN_LIMITS  # noqa: E402

# Подробности возможностей тарифа для письма пользователю
PLAN_NAMES = {
    'premium': 'Премиум',
    'pro_60': 'Профи', 'pro_80': 'Профи', 'pro_200': 'Профи',
    'pro_400': 'Профи', 'pro_800': 'Профи',
}

PLAN_FEATURES = {
    'premium': ['Подключение домена', 'Бесплатные расширения', 'Облачный хостинг', 'До 3 проектов', 'База данных 128 МБ', 'Хранилище 512 МБ', '5 функций', '8 ч вычислений'],
    'pro_60': ['Приоритетная поддержка', 'До 5 проектов', 'База данных 1 ГБ', 'Хранилище 5 ГБ', '25 функций', '250 ч вычислений'],
    'pro_80': ['Приоритетная поддержка', 'До 8 проектов', 'База данных 1 ГБ', 'Хранилище 10 ГБ', '50 функций', '417 ч вычислений'],
    'pro_200': ['Приоритетная поддержка', 'До 10 проектов', 'База данных 2 ГБ', 'Хранилище 20 ГБ', '100 функций', '833 ч вычислений'],
    'pro_400': ['Приоритетная поддержка', 'До 20 проектов', 'База данных 4 ГБ', 'Хранилище 40 ГБ', '200 функций', '1667 ч вычислений'],
    'pro_800': ['Приоритетная поддержка', 'До 50 проектов', 'База данных 10 ГБ', 'Хранилище 100 ГБ', '500 функций', '4167 ч вычислений'],
}


# =============================================================================
# EMAIL
# =============================================================================

def send_plan_activated_email(to_email: str, plan_code: str, requests_limit: int):
    """Отправляет пользователю письмо с подтверждением оплаты и списком возможностей тарифа."""
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not smtp_password or not to_email:
        return

    smtp_user = 'roboweb.site@yandex.ru'
    plan_name = PLAN_NAMES.get(plan_code, plan_code)
    features = PLAN_FEATURES.get(plan_code, [])
    features_html = ''.join(f'<li style="margin:6px 0;">{f}</li>' for f in features)

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'✅ Тариф «{plan_name}» активирован'
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
      <h2 style="color: #3b4cff; margin: 0 0 16px;">Оплата прошла успешно!</h2>
      <p style="color: #444; font-size: 16px; margin: 0 0 8px;">Тариф <strong>«{plan_name}»</strong> активирован на вашем аккаунте.</p>
      <div style="background: #fff; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 10px; color: #111;"><strong>{requests_limit} запросов к AI в месяц</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px;">
          {features_html}
        </ul>
      </div>
      <p style="color: #888; font-size: 13px;">Письмо отправлено автоматически с сайта Roboweb</p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    except Exception:
        pass


def send_energy_purchased_email(to_email: str, energy_amount: int, new_balance: int):
    """Отправляет пользователю письмо с подтверждением покупки энергии (доп. AI-запросов)."""
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not smtp_password or not to_email:
        return

    smtp_user = 'roboweb.site@yandex.ru'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'⚡ Начислено {energy_amount} запросов к AI'
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
      <h2 style="color: #3b4cff; margin: 0 0 16px;">Оплата прошла успешно!</h2>
      <p style="color: #444; font-size: 16px; margin: 0 0 8px;">На ваш аккаунт начислено <strong>+{energy_amount} запросов</strong> к AI (энергия).</p>
      <div style="background: #fff; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #111;"><strong>Текущий баланс энергии: {new_balance} запросов</strong></p>
      </div>
      <p style="color: #666; font-size: 14px; margin: 0 0 8px;">Энергия расходуется автоматически, когда заканчивается месячный лимит вашего тарифа.</p>
      <p style="color: #888; font-size: 13px;">Письмо отправлено автоматически с сайта Roboweb</p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    except Exception:
        pass


# =============================================================================
# SECURITY
# =============================================================================

def verify_payment_via_api(payment_id: str, shop_id: str, secret_key: str) -> dict | None:
    """Verify payment status via YooKassa API.

    YooKassa doesn't use webhook signatures. The recommended approach is to
    verify payment status by making a GET request to the API.
    """
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    request = Request(
        f"{YOOKASSA_API_URL}/{payment_id}",
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Content-Type': 'application/json'
        },
        method='GET'
    )

    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode())
    except (HTTPError, Exception):
        return None


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


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """Handle YooKassa webhook notification."""
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

    # Extract payment info
    event_type = data.get('event', '')
    payment_object = data.get('object', {})
    payment_id = payment_object.get('id', '')
    metadata = payment_object.get('metadata', {})

    if not payment_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Missing payment id'})
        }

    # Security: Verify payment via API (most reliable)
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '').strip()
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '').strip()

    if shop_id and secret_key:
        verified_payment = verify_payment_via_api(payment_id, shop_id, secret_key)
        if not verified_payment:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Payment verification failed'})
            }
        # Use verified status instead of webhook data
        payment_status = verified_payment.get('status', '')
    else:
        # Fallback to webhook data (less secure, only if credentials missing)
        payment_status = payment_object.get('status', '')

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()

        # Find order by payment_id
        cur.execute(f"""
            SELECT id, status, user_id, plan, order_type, energy_amount, user_email FROM {S}orders
            WHERE yookassa_payment_id = %s
        """, (payment_id,))

        row = cur.fetchone()

        if not row:
            # Try to find by order_id from metadata
            order_id_meta = metadata.get('order_id')
            if order_id_meta:
                cur.execute(f"""
                    SELECT id, status, user_id, plan, order_type, energy_amount, user_email FROM {S}orders WHERE id = %s
                """, (int(order_id_meta),))
                row = cur.fetchone()

        if not row:
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Order not found'})
            }

        order_id, current_status, order_user_id, order_plan, order_type, energy_amount, order_email = row

        # Update based on verified payment status
        if payment_status == 'succeeded':
            if current_status != 'paid':
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'paid', paid_at = %s, updated_at = %s
                    WHERE id = %s
                """, (now, now, order_id))

                if order_type == 'energy' and order_user_id and energy_amount:
                    # Начисляем купленную энергию (доп. AI-запросы)
                    cur.execute(f"""
                        UPDATE {S}users SET energy_balance = energy_balance + %s, low_balance_notified = false WHERE id = %s
                        RETURNING energy_balance
                    """, (energy_amount, order_user_id))
                    new_balance_row = cur.fetchone()
                    new_balance = new_balance_row[0] if new_balance_row else energy_amount
                    send_energy_purchased_email(order_email, energy_amount, new_balance)
                elif order_user_id and order_plan:
                    # Активируем тариф пользователю после подтверждённой оплаты
                    # и сразу обновляем лимит AI-запросов под новый тариф
                    new_limit = PLAN_LIMITS.get(order_plan)
                    if new_limit is not None:
                        cur.execute(f"""
                            UPDATE {S}users
                            SET plan = %s, requests_limit = %s, requests_used = 0, requests_reset_at = NOW() + INTERVAL '30 days', low_balance_notified = false
                            WHERE id = %s
                        """, (order_plan, new_limit, order_user_id))
                    else:
                        cur.execute(f"""
                            UPDATE {S}users SET plan = %s, low_balance_notified = false WHERE id = %s
                        """, (order_plan, order_user_id))

                    send_plan_activated_email(order_email, order_plan, new_limit or 0)

                conn.commit()

        elif payment_status == 'canceled':
            if current_status not in ('paid', 'canceled'):
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'canceled', updated_at = %s
                    WHERE id = %s
                """, (now, order_id))
                conn.commit()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'status': 'ok'})
        }

    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Internal error'})
        }
    finally:
        conn.close()