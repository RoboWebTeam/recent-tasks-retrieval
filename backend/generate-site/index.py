import os
import json
import urllib.request
import psycopg2

SYSTEM_PROMPT = """Ты — профессиональный веб-разработчик. Создавай красивые, современные одностраничные сайты (HTML + CSS + JS) в одном файле.

Правила:
1. Возвращай ТОЛЬКО валидный HTML-документ, без markdown, без объяснений
2. Используй встроенный CSS в теге <style> и JS в теге <script>
3. Стиль: современный минимализм, красивые шрифты (Google Fonts), анимации
4. Подключай шрифты через Google Fonts CDN
5. Сайт должен быть полностью адаптивным (mobile-first)
6. Используй CSS-переменные для цветов
7. Добавляй плавные анимации появления элементов
8. Не используй внешние JS-библиотеки кроме Google Fonts
9. Сайт должен выглядеть профессионально и продающе"""

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }

def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}

def get_user_id(session_id: str, schema: str):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
                (session_id,)
            )
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()

PLAN_LIMITS = {
    'free': 10, 'premium': 40,
    'pro_60': 60, 'pro_80': 80, 'pro_200': 200, 'pro_400': 400, 'pro_800': 800,
}

def check_and_consume_quota(user_id: int, schema: str):
    """Проверяет лимит AI-запросов (тариф + энергия) и списывает один запрос.
    Возвращает (allowed: bool, error_message: str|None, remaining: int)"""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT plan, requests_used, requests_limit, requests_reset_at, energy_balance
                    FROM {schema}.users WHERE id = %s FOR UPDATE""",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return False, 'Пользователь не найден', 0
            plan, used, limit, reset_at, energy = row

            from datetime import datetime, timezone
            if reset_at and reset_at <= datetime.now(timezone.utc):
                used = 0
                limit = PLAN_LIMITS.get(plan, limit)
                cur.execute(
                    f"""UPDATE {schema}.users
                        SET requests_used = 0, requests_limit = %s, requests_reset_at = NOW() + INTERVAL '30 days'
                        WHERE id = %s""",
                    (limit, user_id)
                )

            if used < limit:
                cur.execute(f"UPDATE {schema}.users SET requests_used = requests_used + 1 WHERE id = %s", (user_id,))
                conn.commit()
                return True, None, (limit - used - 1) + energy

            if energy > 0:
                cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance - 1 WHERE id = %s", (user_id,))
                conn.commit()
                return True, None, energy - 1

            conn.commit()
            return False, 'Лимит AI-запросов исчерпан. Пополните энергию или смените тариф.', 0
    finally:
        conn.close()

def save_html(project_id: int, html: str, schema: str):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {schema}.projects SET html_content = %s, description = %s, updated_at = NOW() WHERE id = %s",
                (html, html[:300], project_id)
            )
        conn.commit()
    finally:
        conn.close()

def handler(event: dict, context) -> dict:
    """Генерирует HTML-код сайта через OpenAI GPT-4 по описанию пользователя"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    session_id = headers.get('x-session-id', '')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not session_id:
        return err('Не авторизован', 401)

    user_id = get_user_id(session_id, schema)
    if not user_id:
        return err('Сессия истекла', 401)

    allowed, quota_error, remaining = check_and_consume_quota(user_id, schema)
    if not allowed:
        return err(quota_error, 402)

    body = json.loads(event.get('body') or '{}')
    messages = body.get('messages', [])
    project_id = body.get('project_id')

    if not messages:
        return err('Нет сообщений')

    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return err('OpenAI API ключ не настроен')

    # Формируем запрос к OpenAI
    chat_messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for m in messages:
        chat_messages.append({'role': m.get('role', 'user'), 'content': m.get('content', '')})

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': chat_messages,
        'max_tokens': 8000,
        'temperature': 0.7,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        return err(f'OpenAI API error {e.code}', 502)
    except urllib.error.URLError:
        return err('OpenAI API недоступен. Попробуйте позже.', 503)
    except (json.JSONDecodeError, Exception):
        return err('Неверный ответ от OpenAI.', 502)

    choices = result.get('choices') or []
    if not choices:
        return err('OpenAI вернул пустой ответ.', 502)

    html = (choices[0].get('message') or {}).get('content', '').strip()
    if not html:
        return err('OpenAI вернул пустой HTML.', 502)

    # Убираем markdown-обёртку если есть
    if html.startswith('```'):
        lines = html.split('\n')
        html = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])

    # Сохраняем HTML в проект если передан project_id
    if project_id:
        save_html(int(project_id), html, schema)

    return ok({'html': html, 'tokens': result.get('usage', {}).get('total_tokens', 0), 'remaining': remaining})