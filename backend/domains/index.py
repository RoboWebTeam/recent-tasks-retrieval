import os
import re
import json
import urllib.request
import urllib.parse
import psycopg2

SERVER_IP = '185.230.209.10'
CNAME_VALUE = 'cname.roboweb.dev'

REGISTRAR_PATTERNS = [
    ('Reg.ru', re.compile(r'reg\.ru$', re.I)),
    ('RuCenter (Nic.ru)', re.compile(r'nic\.ru$', re.I)),
    ('Timeweb', re.compile(r'timeweb\.(ru|net|org)$', re.I)),
    ('Yandex', re.compile(r'yandex\.(ru|net|com)$', re.I)),
    ('GoDaddy', re.compile(r'domaincontrol\.com$', re.I)),
    ('Namecheap', re.compile(r'registrar-servers\.com$', re.I)),
    ('Cloudflare', re.compile(r'cloudflare\.com$', re.I)),
    ('Beget', re.compile(r'beget\.(ru|com)$', re.I)),
]


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }


def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user_id(cur, schema: str, session_id: str):
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    return row[0] if row else None


def validate_domain(domain: str) -> bool:
    pattern = re.compile(r'^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$')
    return bool(pattern.match(domain))


def clean_domain(raw: str) -> str:
    return raw.strip().lower().replace('https://', '').replace('http://', '').rstrip('/')


def dns_query(name: str, record_type: str):
    url = f"https://dns.google/resolve?name={urllib.parse.quote(name)}&type={record_type}"
    req = urllib.request.Request(url, headers={'Accept': 'application/dns-json'})
    with urllib.request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode('utf-8'))


def check_dns(domain: str):
    a_ok = False
    cname_ok = False
    found_a = []
    found_cname = ''
    registrar = None

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

    try:
        ns_result = dns_query(domain, 'NS')
        answers = ns_result.get('Answer', [])
        ns_records = [a.get('data', '').rstrip('.') for a in answers if a.get('type') == 2]
        for name, pattern in REGISTRAR_PATTERNS:
            if any(pattern.search(ns) for ns in ns_records):
                registrar = name
                break
    except Exception:
        pass

    verified = a_ok or cname_ok
    return {
        'verified': verified,
        'a_record': {'expected': SERVER_IP, 'found': found_a, 'ok': a_ok},
        'cname_record': {'expected': CNAME_VALUE, 'found': found_cname, 'ok': cname_ok},
        'registrar': registrar,
    }


def domain_row_to_dict(row):
    return {
        'id': row[0],
        'domain': row[1],
        'status': row[2],
        'is_primary': row[3],
        'redirect_mode': row[4],
        'ssl_status': row[5],
        'ssl_issued_at': row[6].isoformat() if row[6] else None,
        'ssl_expires_at': row[7].isoformat() if row[7] else None,
        'last_checked_at': row[8].isoformat() if row[8] else None,
        'verified_at': row[9].isoformat() if row[9] else None,
        'created_at': row[10].isoformat() if row[10] else None,
        'project_id': row[11],
        'project_title': row[12],
    }


def handler(event: dict, context) -> dict:
    """Управление доменами пользователя: список, добавление, проверка DNS, удаление, основной домен, редирект, привязка к проекту"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    session_id = headers.get('x-session-id', '')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not session_id:
        return err('Не авторизован', 401)

    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        return err('Некорректный формат данных запроса', 400)
    params = event.get('queryStringParameters') or {}

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            user_id = get_user_id(cur, schema, session_id)
            if not user_id:
                return err('Сессия истекла', 401)

            select_cols = """d.id, d.domain, d.status, d.is_primary, d.redirect_mode,
                              d.ssl_status, d.ssl_issued_at, d.ssl_expires_at,
                              d.last_checked_at, d.verified_at, d.created_at,
                              d.project_id, p.title"""

            if method == 'GET':
                cur.execute(
                    f"""SELECT {select_cols} FROM {schema}.domains d
                        LEFT JOIN {schema}.projects p ON p.id = d.project_id
                        WHERE d.user_id = %s ORDER BY d.created_at DESC""",
                    (user_id,)
                )
                rows = cur.fetchall()
                domains = [domain_row_to_dict(r) for r in rows]

                cur.execute(
                    f"SELECT id, title FROM {schema}.projects WHERE user_id = %s ORDER BY updated_at DESC",
                    (user_id,)
                )
                projects = [{'id': r[0], 'title': r[1]} for r in cur.fetchall()]

                return ok({'domains': domains, 'projects': projects})

            if method == 'POST':
                action = body.get('action', '')

                if action == 'add':
                    raw_domain = body.get('domain', '')
                    domain = clean_domain(raw_domain)
                    if not validate_domain(domain):
                        return err('Некорректный формат домена')

                    cur.execute(f"SELECT id FROM {schema}.domains WHERE domain = %s", (domain,))
                    if cur.fetchone():
                        return err('Этот домен уже добавлен')

                    project_id = body.get('project_id')
                    # Если домен привязывается к проекту — проверяем, что проект принадлежит
                    # пользователю (иначе можно было бы привязать домен к чужому проекту).
                    if project_id:
                        cur.execute(f"SELECT id FROM {schema}.projects WHERE id = %s AND user_id = %s", (project_id, user_id))
                        if not cur.fetchone():
                            return err('Проект не найден', 404)

                    cur.execute(f"SELECT COUNT(*) FROM {schema}.domains WHERE user_id = %s", (user_id,))
                    is_first = cur.fetchone()[0] == 0

                    cur.execute(
                        f"""INSERT INTO {schema}.domains (user_id, project_id, domain, is_primary)
                            VALUES (%s, %s, %s, %s)
                            RETURNING id, domain, status, is_primary, redirect_mode, ssl_status,
                                      ssl_issued_at, ssl_expires_at, last_checked_at, verified_at, created_at, project_id""",
                        (user_id, project_id, domain, is_first)
                    )
                    row = cur.fetchone()
                    conn.commit()
                    result = domain_row_to_dict(row + (None,))
                    if project_id:
                        cur.execute(f"SELECT title FROM {schema}.projects WHERE id = %s", (project_id,))
                        prow = cur.fetchone()
                        result['project_title'] = prow[0] if prow else None
                    return ok({'domain': result})

                if action == 'verify':
                    domain_id = body.get('id')
                    cur.execute(f"SELECT domain FROM {schema}.domains WHERE id = %s AND user_id = %s", (domain_id, user_id))
                    row = cur.fetchone()
                    if not row:
                        return err('Домен не найден', 404)
                    domain = row[0]

                    dns_result = check_dns(domain)
                    new_status = 'active' if dns_result['verified'] else 'pending'
                    ssl_status = 'active' if dns_result['verified'] else 'pending'

                    if dns_result['verified']:
                        cur.execute(
                            f"""UPDATE {schema}.domains
                                SET status = %s, ssl_status = %s, last_checked_at = NOW(),
                                    verified_at = COALESCE(verified_at, NOW()),
                                    ssl_issued_at = COALESCE(ssl_issued_at, NOW()),
                                    ssl_expires_at = COALESCE(ssl_expires_at, NOW() + INTERVAL '90 days')
                                WHERE id = %s""",
                            (new_status, ssl_status, domain_id)
                        )
                    else:
                        cur.execute(
                            f"UPDATE {schema}.domains SET status = %s, last_checked_at = NOW() WHERE id = %s",
                            (new_status, domain_id)
                        )
                    conn.commit()
                    return ok({'dns': dns_result, 'status': new_status})

                if action == 'set_primary':
                    domain_id = body.get('id')
                    cur.execute(f"SELECT id FROM {schema}.domains WHERE id = %s AND user_id = %s", (domain_id, user_id))
                    if not cur.fetchone():
                        return err('Домен не найден', 404)
                    cur.execute(f"UPDATE {schema}.domains SET is_primary = false WHERE user_id = %s", (user_id,))
                    cur.execute(f"UPDATE {schema}.domains SET is_primary = true WHERE id = %s", (domain_id,))
                    conn.commit()
                    return ok({'ok': True})

                if action == 'set_redirect':
                    domain_id = body.get('id')
                    redirect_mode = body.get('redirect_mode', 'none')
                    if redirect_mode not in ('none', 'www_to_root', 'root_to_www'):
                        return err('Некорректный режим редиректа')
                    cur.execute(
                        f"UPDATE {schema}.domains SET redirect_mode = %s WHERE id = %s AND user_id = %s",
                        (redirect_mode, domain_id, user_id)
                    )
                    # Если ничего не обновилось — домен не принадлежит пользователю, честно вернём 404.
                    if cur.rowcount == 0:
                        return err('Домен не найден', 404)
                    conn.commit()
                    return ok({'ok': True})

                if action == 'assign_project':
                    domain_id = body.get('id')
                    project_id = body.get('project_id')
                    if project_id:
                        cur.execute(f"SELECT id FROM {schema}.projects WHERE id = %s AND user_id = %s", (project_id, user_id))
                        if not cur.fetchone():
                            return err('Проект не найден', 404)
                    cur.execute(
                        f"UPDATE {schema}.domains SET project_id = %s WHERE id = %s AND user_id = %s",
                        (project_id, domain_id, user_id)
                    )
                    if cur.rowcount == 0:
                        return err('Домен не найден', 404)
                    conn.commit()
                    return ok({'ok': True})

                return err('Неизвестное действие')

            if method == 'DELETE':
                domain_id = params.get('id')
                if not domain_id:
                    return err('Укажите id домена')
                cur.execute(f"DELETE FROM {schema}.domains WHERE id = %s AND user_id = %s", (domain_id, user_id))
                if cur.rowcount == 0:
                    return err('Домен не найден', 404)
                conn.commit()
                return ok({'ok': True})

    except Exception:
        # Любая ошибка БД (напр. гонка при добавлении дубля домена) — откатываем транзакцию
        # и возвращаем понятный ответ вместо голого 500.
        conn.rollback()
        return err('Ошибка обработки запроса. Попробуйте ещё раз.', 500)
    finally:
        conn.close()

    return err('Not found', 404)