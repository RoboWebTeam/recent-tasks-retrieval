import os
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Отправляет заявку с формы регистрации на почту roboweb.site@yandex.ru"""

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

    smtp_user = 'roboweb.site@yandex.ru'
    smtp_password = os.environ['SMTP_PASSWORD']

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

    with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, smtp_user, msg.as_string())

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': {'ok': True}
    }