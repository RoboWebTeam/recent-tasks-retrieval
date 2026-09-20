"""Сброс забытого пароля.

SMTP на VPS не работает (провайдер блокирует исходящие порты — см. backend/send-email),
поэтому это не «токен по почте», а запрос-подтверждение: пользователь вводит e-mail и
остаётся на той же странице, владелец получает карточку в Telegram (общий форвардер
82.23.163.117:8791/lead — уже обслуживает Реестр и СтройОко, roboweb.dev добавлен
20.09.2026) и одобряет одной кнопкой, страница пользователя видит это через поллинг —
тот же паттерн, что demo-access у остальных продуктов студии.

Решение по ссылке в Telegram — ТОЛЬКО через POST с реальной страницы подтверждения:
превью-бот Telegram сам открывает ссылки (GET) для карточки, и если бы GET уже решал —
любая заявка одобрялась бы сама собой, как только Telegram отрисует превью кнопки.
"""
import os
import sys
import json
import time
import hmac
import base64
import hashlib
import secrets
import bcrypt
import psycopg2
import urllib.request
from datetime import datetime, timezone

_bd = os.path.dirname(os.path.abspath(__file__))
while _bd != os.path.dirname(_bd) and not os.path.isdir(os.path.join(_bd, '_shared')):
    _bd = os.path.dirname(_bd)
if _bd not in sys.path:
    sys.path.insert(0, _bd)

SCHEMA = None
FORWARDER_URL = os.environ.get('TG_FORWARD_URL', 'http://127.0.0.1:8791/lead')
SITE_URL = os.environ.get('SITE_URL', 'https://roboweb.dev').rstrip('/')
BASE_SECRET = os.environ.get('ADMIN_KEY') or os.environ.get('DATABASE_URL', 'insecure-dev-secret')


def get_schema():
    global SCHEMA
    if not SCHEMA:
        SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return SCHEMA


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }


def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': cors_headers(), 'body': data}


def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': cors_headers(), 'body': {'error': msg}}


def html_page(body: str, code: int = 200) -> dict:
    headers = cors_headers()
    headers['Content-Type'] = 'text/html; charset=utf-8'
    return {'statusCode': code, 'headers': headers, 'body': body}


def esc(s) -> str:
    return (str(s or '')
            .replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;'))


def _hmac(secret: str, msg: str) -> str:
    d = hmac.new(secret.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(d).decode('utf-8').rstrip('=')


SECRET = _hmac(BASE_SECRET, 'roboweb/password-reset/v1')


def review_sig(req_id: str) -> str:
    return _hmac(SECRET, f'review:{req_id}')[:32]


def poll_token(req_id: str) -> str:
    return _hmac(SECRET, f'poll:{req_id}')[:32]


def safe_equal(a: str, b: str) -> bool:
    return hmac.compare_digest(str(a or ''), str(b or ''))


def make_id() -> str:
    alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(secrets.choice(alphabet) for _ in range(10))


def send_telegram(text: str, reply_markup: dict = None) -> bool:
    try:
        payload = {'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': True}
        if reply_markup:
            payload['reply_markup'] = reply_markup
        req = urllib.request.Request(
            FORWARDER_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            r.read()
        return True
    except Exception as ex:
        print(f'[password-reset] telegram error: {repr(ex)[:200]}', flush=True)
        return False


# --- rate limiting (та же схема, что в backend/auth) ---
def check_rate_limit(conn, schema: str, key: str, max_attempts: int = 5, window_minutes: int = 30) -> bool:
    window_minutes = int(window_minutes)
    max_attempts = int(max_attempts)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"DELETE FROM {schema}.rate_limits WHERE key = %s AND created_at < NOW() - make_interval(mins => %s)",
                (key, window_minutes)
            )
            cur.execute(f"SELECT COUNT(*) FROM {schema}.rate_limits WHERE key = %s", (key,))
            count = cur.fetchone()[0]
            if count >= max_attempts:
                conn.commit()
                return False
            cur.execute(f"INSERT INTO {schema}.rate_limits (key) VALUES (%s)", (key,))
            conn.commit()
            return True
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        return False


def do_request(body: dict, event: dict) -> dict:
    email = (body.get('email') or '').strip().lower()
    if not email or '@' not in email:
        return err('Укажите корректный e-mail')

    ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp', 'unknown')
    schema = get_schema()
    conn = get_conn()
    try:
        if not check_rate_limit(conn, schema, f'pwreset:{ip}', max_attempts=8, window_minutes=30):
            return err('Слишком много попыток. Попробуйте позже', 429)
        if not check_rate_limit(conn, schema, f'pwreset:email:{email}', max_attempts=3, window_minutes=30):
            return err('Слишком много попыток. Попробуйте позже', 429)

        with conn.cursor() as cur:
            cur.execute(f"SELECT id, name FROM {schema}.users WHERE lower(email) = %s", (email,))
            row = cur.fetchone()

        req_id = make_id()
        # Пользователя с таким e-mail нет — заявку НЕ создаём и в Telegram НЕ шлём, но отвечаем
        # тем же самым видом успеха с тем же id/poll: страница пользователя просто никогда не
        # получит approved — это неотличимо от «ждём владельца» и не палит, зарегистрирован ли e-mail.
        if row:
            user_id, name = row
            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {schema}.password_reset_requests (id, user_id, email, ip)
                        VALUES (%s, %s, %s, %s)""",
                    (req_id, user_id, email, ip)
                )
            conn.commit()

            approve_url = f'{SITE_URL}/api/password-reset?id={req_id}&do=approve&sig={review_sig(req_id)}'
            reject_url = f'{SITE_URL}/api/password-reset?id={req_id}&do=reject&sig={review_sig(req_id)}'
            text = (
                f'🔑 <b>Сброс пароля на roboweb.dev</b>\n'
                f'{esc(name) or "Без имени"} · {esc(email)}\n'
                f'IP: {esc(ip)}\n'
                f'Заявка: {req_id}'
            )
            reply_markup = {'inline_keyboard': [[
                {'text': '✅ Подтвердить', 'url': approve_url},
                {'text': '❌ Отклонить', 'url': reject_url},
            ]]}
            send_telegram(text, reply_markup)

        return ok({'id': req_id, 'poll': poll_token(req_id)})
    finally:
        conn.close()


def do_status(req_id: str, poll: str) -> dict:
    if not req_id or not safe_equal(poll, poll_token(req_id)):
        return err('Неверная ссылка', 403)
    schema = get_schema()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT status, expires_at < NOW() FROM {schema}.password_reset_requests WHERE id = %s""",
                (req_id,)
            )
            row = cur.fetchone()
        if not row:
            # Неизвестный/несуществующий e-mail на шаге request — заявки нет, но это не должно
            # отличаться внешне: отвечаем «pending», как будто владелец ещё не посмотрел.
            return ok({'status': 'pending'})
        status, expired = row
        if status == 'pending' and expired:
            return ok({'status': 'expired'})
        return ok({'status': status})
    finally:
        conn.close()


def do_confirm(req_id: str, poll: str, password: str) -> dict:
    if not req_id or not safe_equal(poll, poll_token(req_id)):
        return err('Неверная ссылка', 403)
    if not password or len(password) < 6:
        return err('Пароль должен быть не короче 6 символов')
    schema = get_schema()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT user_id, status, expires_at < NOW() FROM {schema}.password_reset_requests
                    WHERE id = %s FOR UPDATE""",
                (req_id,)
            )
            row = cur.fetchone()
            if not row:
                return err('Заявка не найдена', 404)
            user_id, status, expired = row
            if status != 'approved':
                return err('Заявка ещё не подтверждена владельцем', 409)
            if expired:
                return err('Заявка истекла, запросите сброс ещё раз', 410)

            cur.execute(
                f"UPDATE {schema}.users SET password_hash = %s WHERE id = %s",
                (hash_password(password), user_id)
            )
            cur.execute(
                f"UPDATE {schema}.password_reset_requests SET status = 'used' WHERE id = %s",
                (req_id,)
            )
            # Новый пароль — значит, все текущие сессии больше не заслуживают доверия.
            cur.execute(f"DELETE FROM {schema}.sessions WHERE user_id = %s", (user_id,))
        conn.commit()
        return ok({'success': True})
    finally:
        conn.close()


def render_confirm_page(req_id: str, action: str, sig: str) -> dict:
    if action not in ('approve', 'reject') or not safe_equal(sig, review_sig(req_id)):
        return html_page(_page('Ссылка недействительна', '<p>Проверьте, что перешли по полной ссылке из Telegram.</p>'), 403)

    schema = get_schema()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT email, status, created_at FROM {schema}.password_reset_requests WHERE id = %s""",
                (req_id,)
            )
            row = cur.fetchone()
    finally:
        conn.close()

    if not row:
        return html_page(_page('Заявка не найдена', '<p>Возможно, она уже устарела.</p>'), 404)
    email, status, created_at = row

    if status != 'pending':
        label = {'approved': 'уже подтверждена ✅', 'rejected': 'уже отклонена ❌', 'used': 'пароль уже изменён ✅'}.get(status, status)
        return html_page(_page('Заявка обработана', f'<p>Заявка от <b>{esc(email)}</b> {label}.</p>'))

    verb = 'Подтвердить' if action == 'approve' else 'Отклонить'
    color = '#22c55e' if action == 'approve' else '#ef4444'
    body = f"""
      <p>Заявка на сброс пароля от <b>{esc(email)}</b>, создана {esc(created_at)}.</p>
      <p>Нажмите кнопку ниже, чтобы {'подтвердить' if action == 'approve' else 'отклонить'} — это откроет пользователю доступ к смене пароля{'​' if action == 'approve' else ' и закроет заявку'}.</p>
      <form method="POST" action="/api/password-reset">
        <input type="hidden" name="action" value="decide">
        <input type="hidden" name="id" value="{esc(req_id)}">
        <input type="hidden" name="decide_action" value="{esc(action)}">
        <input type="hidden" name="sig" value="{esc(sig)}">
        <button type="submit" style="background:{color}">{verb}</button>
      </form>
    """
    return html_page(_page(f'{verb} заявку?', body))


def _page(title: str, body: str) -> str:
    return f"""<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{esc(title)} — Roboweb</title>
<style>
body{{font-family:-apple-system,system-ui,sans-serif;background:#0b0d17;color:#e6e8f0;
  display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}}
.card{{max-width:420px;background:#151827;border:1px solid #262a3f;border-radius:16px;padding:32px}}
h1{{font-size:20px;margin:0 0 16px}}
p{{line-height:1.6;color:#a5a9c0}}
b{{color:#e6e8f0}}
button{{width:100%;margin-top:16px;padding:12px;border:0;border-radius:10px;color:#fff;
  font-weight:600;font-size:15px;cursor:pointer}}
</style></head><body><div class="card"><h1>{esc(title)}</h1>{body}</div></body></html>"""


def do_decide(req_id: str, action: str, sig: str) -> dict:
    if action not in ('approve', 'reject') or not safe_equal(sig, review_sig(req_id)):
        return err('Недействительная подпись', 403)
    schema = get_schema()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT status, email FROM {schema}.password_reset_requests WHERE id = %s FOR UPDATE""",
                (req_id,)
            )
            row = cur.fetchone()
            if not row:
                return html_page(_page('Заявка не найдена', '<p>Возможно, она уже устарела.</p>'), 404)
            status, email = row
            if status != 'pending':
                return html_page(_page('Уже обработано', f'<p>Заявка от <b>{esc(email)}</b> уже была обработана раньше.</p>'))
            new_status = 'approved' if action == 'approve' else 'rejected'
            cur.execute(
                f"""UPDATE {schema}.password_reset_requests SET status = %s, decided_at = NOW() WHERE id = %s""",
                (new_status, req_id)
            )
        conn.commit()
        label = 'подтверждена ✅ — пользователь увидит форму нового пароля' if action == 'approve' else 'отклонена ❌'
        return html_page(_page('Готово', f'<p>Заявка от <b>{esc(email)}</b> {label}.</p>'))
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    qs = event.get('queryStringParameters') or {}

    # Ссылка из Telegram: показать страницу подтверждения (сама по себе GET НИЧЕГО не решает —
    # решает только POST с этой страницы, иначе превью-бот Telegram одобрил бы заявки сам).
    if method == 'GET' and qs.get('id') and qs.get('sig'):
        return render_confirm_page(qs['id'], qs.get('do', ''), qs['sig'])

    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        body = {}
        # POST от HTML-формы страницы подтверждения приходит как x-www-form-urlencoded, не JSON.
        raw = event.get('body') or ''
        if raw and '=' in raw:
            from urllib.parse import parse_qsl
            body = dict(parse_qsl(raw))

    action = body.get('action', '')

    if method == 'POST' and action == 'decide':
        return do_decide(body.get('id', ''), body.get('decide_action', ''), body.get('sig', ''))
    if method == 'POST' and action == 'request':
        return do_request(body, event)
    if method == 'POST' and action == 'status':
        return do_status(body.get('id', ''), body.get('poll', ''))
    if method == 'POST' and action == 'confirm':
        return do_confirm(body.get('id', ''), body.get('poll', ''), body.get('password', ''))

    return err('Неизвестное действие', 400)
