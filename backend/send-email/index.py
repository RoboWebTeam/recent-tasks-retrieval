import os
import smtplib
import json
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Сохраняет заявку в БД и отправляет письмо на roboweb.site@yandex.ru"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    email = body.get('email', '').strip()

    if not email or '@' not in email:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': {'error': 'Укажите корректный e-mail'}
        }

    # Сохраняем в БД
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
            cur.execute(
                f"INSERT INTO {schema}.leads (email) VALUES (%s)",
                (email,)
            )
        conn.commit()
    finally:
        conn.close()

    # Отправляем письмо
    smtp_user = 'roboweb.site@yandex.ru'
    smtp_password = os.environ.get('SMTP_PASSWORD', '')

    msg = MIMEMultipart('alternative')
    msg['Subject'] = '🚀 Новая заявка с сайта Roboweb'
    msg['From'] = smtp_user
    msg['To'] = smtp_user

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
      <h2 style="color: #3b4cff; margin: 0 0 16px;">Новая заявка с сайта</h2>
      <p style="color: #444; font-size: 16px; margin: 0 0 8px;">Пользователь оставил заявку на создание сайта:</p>
      <div style="background: #fff; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #e5e7eb;">
        <strong style="color: #111;">E-mail:</strong>
        <span style="color: #3b4cff; margin-left: 8px;">{email}</span>
      </div>
      <p style="color: #888; font-size: 13px;">Письмо отправлено автоматически с сайта Roboweb</p>
    </div>
    """

    msg.attach(MIMEText(html, 'html'))

    # Отправка письма НЕ должна ронять заявку: лид уже сохранён в БД. Любой сбой SMTP
    # (нет пароля, заблокирован исходящий 465, таймаут) — логируем и всё равно отдаём 200,
    # иначе посетитель видит ошибку, а воркер gunicorn висит на TCP-коннекте без таймаута.
    if smtp_password:
        try:
            with smtplib.SMTP_SSL('smtp.yandex.ru', 465, timeout=10) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, smtp_user, msg.as_string())
        except Exception as ex:
            print(f'[send-email] SMTP не сработал (лид сохранён в БД): {repr(ex)[:200]}', flush=True)
    else:
        print('[send-email] SMTP_PASSWORD не задан — письмо пропущено, лид сохранён в БД', flush=True)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': {'ok': True}
    }