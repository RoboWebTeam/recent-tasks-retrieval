import os
import json
import base64
import urllib.request
import psycopg2
import boto3


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }


def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': data}


def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


def get_user_id(session_id: str, schema: str):
    conn = get_conn()
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
    """Генерация картинки расходует один AI-запрос из общей квоты (тариф + энергия).
    Возвращает (allowed: bool, error_message: str|None, remaining: int)"""
    conn = get_conn()
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


def refund_quota(user_id: int, schema: str):
    """Возвращает списанный запрос, если генерация изображения не удалась."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT requests_used FROM {schema}.users WHERE id = %s FOR UPDATE",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return
            used = row[0]
            if used > 0:
                cur.execute(f"UPDATE {schema}.users SET requests_used = requests_used - 1 WHERE id = %s", (user_id,))
            else:
                cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance + 1 WHERE id = %s", (user_id,))
            conn.commit()
    except Exception:
        pass
    finally:
        conn.close()


def save_file(user_id: int, project_id, file_name: str, file_key: str, cdn_url: str, size: int, schema: str):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""INSERT INTO {schema}.site_files (user_id, project_id, file_name, file_key, file_url, file_type, file_size)
                    VALUES (%s, %s, %s, %s, %s, 'image', %s)""",
                (user_id, project_id, file_name, file_key, cdn_url, size)
            )
        conn.commit()
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Генерирует изображение через Gemini (OpenRouter) по текстовому описанию и сохраняет его в хранилище проекта"""

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

    body = json.loads(event.get('body') or '{}')
    prompt = (body.get('prompt') or '').strip()
    project_id = body.get('project_id')
    size = body.get('size', '1024x1024')

    if not prompt:
        return err('Опишите изображение, которое нужно сгенерировать')

    allowed, quota_error, remaining = check_and_consume_quota(user_id, schema)
    if not allowed:
        return err(quota_error, 402)

    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if not api_key:
        return err('OpenRouter API ключ не настроен')

    aspect_ratio = '1:1'
    if size == '1792x1024':
        aspect_ratio = '16:9'
    elif size == '1024x1792':
        aspect_ratio = '9:16'

    payload = json.dumps({
        'model': 'google/gemini-2.5-flash-image-preview',
        'messages': [{'role': 'user', 'content': prompt}],
        'modalities': ['image', 'text'],
        'image_config': {'aspect_ratio': aspect_ratio},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
            'HTTP-Referer': 'https://roboweb.site',
            'X-Title': 'Roboweb',
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            result = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', errors='ignore')
        refund_quota(user_id, schema)
        return err(f'Ошибка OpenRouter: {detail[:200]}', 502)
    except urllib.error.URLError:
        refund_quota(user_id, schema)
        return err('OpenRouter API недоступен. Попробуйте позже.', 503)
    except (json.JSONDecodeError, Exception):
        refund_quota(user_id, schema)
        return err('Неверный ответ от OpenRouter.', 502)

    choices = result.get('choices') or []
    images = choices[0].get('message', {}).get('images') if choices else None
    if not images or not images[0].get('image_url', {}).get('url'):
        refund_quota(user_id, schema)
        return err('Модель не вернула изображение.', 502)

    data_url = images[0]['image_url']['url']
    if ',' not in data_url:
        refund_quota(user_id, schema)
        return err('Некорректный формат изображения от модели.', 502)

    img_bytes = base64.b64decode(data_url.split(',', 1)[1])
    revised_prompt = prompt

    file_name = f"ai_image_{context.request_id}.png"
    key = f"sites/{user_id}/{file_name}"

    s3 = get_s3()
    s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    save_file(user_id, project_id, file_name, key, cdn_url, len(img_bytes), schema)

    return ok({'url': cdn_url, 'file_name': file_name, 'revised_prompt': revised_prompt, 'remaining': remaining})