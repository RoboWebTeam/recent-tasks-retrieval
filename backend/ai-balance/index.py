import os
import json
import urllib.request

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
}

def ok(data): return {'statusCode': 200, 'headers': CORS, 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': CORS, 'body': {'error': msg}}


def handler(event: dict, context) -> dict:
    """Возвращает текущий баланс кредитов OpenRouter (только для администратора)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_key = headers.get('x-admin-key', '')

    if not admin_key or admin_key != os.environ.get('ADMIN_KEY', ''):
        return err('Не авторизован', 401)

    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if not api_key:
        return err('OpenRouter API ключ не настроен')

    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/credits',
        headers={'Authorization': f'Bearer {api_key}'},
        method='GET'
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return err(f'OpenRouter API error {e.code}', 502)
    except urllib.error.URLError:
        return err('OpenRouter API недоступен. Попробуйте позже.', 503)
    except (json.JSONDecodeError, Exception):
        return err('Неверный ответ от OpenRouter.', 502)

    data = result.get('data', {})
    total_credits = data.get('total_credits', 0)
    total_usage = data.get('total_usage', 0)
    remaining = round(total_credits - total_usage, 4)

    return ok({
        'total_credits': total_credits,
        'total_usage': round(total_usage, 4),
        'remaining': remaining,
        'low_balance': remaining < 5,
    })