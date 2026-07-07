import json
import urllib.request
import urllib.parse

SERVER_IP = '185.230.209.10'
CNAME_VALUE = 'cname.roboweb.dev'

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}

def dns_query(name: str, record_type: str):
    """Запрос к Google DNS-over-HTTPS API — не требует установки доп. библиотек"""
    url = f"https://dns.google/resolve?name={urllib.parse.quote(name)}&type={record_type}"
    req = urllib.request.Request(url, headers={'Accept': 'application/dns-json'})
    with urllib.request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode('utf-8'))

def handler(event: dict, context) -> dict:
    """Проверяет реальные DNS-записи домена (A и CNAME) через Google DNS-over-HTTPS"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    params = event.get('queryStringParameters') or {}
    domain = params.get('domain', '').strip().lower()

    if not domain:
        return err('Укажите домен')

    a_ok = False
    cname_ok = False
    found_a = []
    found_cname = ''

    try:
        a_result = dns_query(domain, 'A')
        answers = a_result.get('Answer', [])
        found_a = [a.get('data', '') for a in answers if a.get('type') == 1]
        a_ok = SERVER_IP in found_a
    except Exception:
        pass

    try:
        cname_result = dns_query(f'www.{domain}', 'CNAME')
        answers = cname_result.get('Answer', [])
        cnames = [a.get('data', '').rstrip('.') for a in answers if a.get('type') == 5]
        found_cname = cnames[0] if cnames else ''
        cname_ok = CNAME_VALUE.rstrip('.') in [c.rstrip('.') for c in cnames]
    except Exception:
        pass

    verified = a_ok or cname_ok

    return ok({
        'verified': verified,
        'a_record': {'expected': SERVER_IP, 'found': found_a, 'ok': a_ok},
        'cname_record': {'expected': CNAME_VALUE, 'found': found_cname, 'ok': cname_ok},
    })
