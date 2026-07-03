import os
import json
import re
import base64
import urllib.request
import urllib.error
import psycopg2


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }


def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def gh_request(url, token, method='GET', payload=None):
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Roboweb',
            'Content-Type': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read()
            return resp.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            data = json.loads(body)
        except Exception:
            data = {'message': body.decode('utf-8', errors='ignore')}
        return e.code, data


def slugify_repo_name(title: str) -> str:
    base = re.sub(r'[^a-zA-Z0-9-]+', '-', title.strip()).strip('-').lower()[:80]
    return base or 'roboweb-site'


def handler(event: dict, context) -> dict:
    """Публикация сгенерированного сайта в новый GitHub-репозиторий пользователя с включением GitHub Pages"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    if event.get('httpMethod') != 'POST':
        return err('Method not allowed', 405)

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    session_id = headers.get('x-session-id', '')
    if not session_id:
        return err('Не авторизован', 401)

    schema = get_schema()
    body = json.loads(event.get('body') or '{}')
    project_id = body.get('project_id')
    title = (body.get('title') or 'roboweb-site').strip()

    if not project_id:
        return err('Укажите project_id')

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
                (session_id,)
            )
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            user_id = row[0]

            cur.execute(
                f"SELECT github_access_token, github_login FROM {schema}.users WHERE id = %s",
                (user_id,)
            )
            urow = cur.fetchone()
            if not urow or not urow[0]:
                return err('Сначала подключите GitHub-аккаунт (войдите через GitHub на странице входа)', 428)
            token, gh_login = urow

            cur.execute(
                f"SELECT html_content, github_repo_name FROM {schema}.projects WHERE id = %s AND user_id = %s",
                (project_id, user_id)
            )
            prow = cur.fetchone()
            if not prow:
                return err('Проект не найден', 404)
            html_content, existing_repo = prow
            if not html_content:
                return err('Сначала сгенерируйте сайт перед публикацией в GitHub')

            repo_name = existing_repo or slugify_repo_name(title)

            # Проверяем, существует ли уже такой репозиторий у пользователя
            status, repo_data = gh_request(f'https://api.github.com/repos/{gh_login}/{repo_name}', token)

            if status == 404:
                # Создаём новый репозиторий
                status, repo_data = gh_request(
                    'https://api.github.com/user/repos', token, method='POST',
                    payload={'name': repo_name, 'description': f'Сайт создан на Roboweb: {title}', 'auto_init': False, 'private': False}
                )
                if status not in (200, 201):
                    # Имя занято другим репо — добавляем суффикс
                    import random, string
                    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
                    repo_name = f'{repo_name}-{suffix}'
                    status, repo_data = gh_request(
                        'https://api.github.com/user/repos', token, method='POST',
                        payload={'name': repo_name, 'description': f'Сайт создан на Roboweb: {title}', 'auto_init': False, 'private': False}
                    )
                    if status not in (200, 201):
                        return err(f'Не удалось создать репозиторий на GitHub: {repo_data.get("message", "unknown error")}', 502)
            elif status != 200:
                return err(f'Ошибка GitHub API: {repo_data.get("message", "unknown error")}', 502)

            repo_full_name = repo_data.get('full_name', f'{gh_login}/{repo_name}')

            # Проверяем, существует ли уже index.html (для получения sha при обновлении)
            existing_sha = None
            fstatus, fdata = gh_request(f'https://api.github.com/repos/{repo_full_name}/contents/index.html', token)
            if fstatus == 200:
                existing_sha = fdata.get('sha')

            content_b64 = base64.b64encode(html_content.encode('utf-8')).decode('ascii')
            put_payload = {
                'message': 'Обновление сайта из Roboweb' if existing_sha else 'Первая публикация сайта из Roboweb',
                'content': content_b64,
            }
            if existing_sha:
                put_payload['sha'] = existing_sha

            pstatus, pdata = gh_request(
                f'https://api.github.com/repos/{repo_full_name}/contents/index.html', token,
                method='PUT', payload=put_payload
            )
            if pstatus not in (200, 201):
                return err(f'Не удалось загрузить файл в репозиторий: {pdata.get("message", "unknown error")}', 502)

            # Включаем GitHub Pages (ветка по умолчанию, корень репозитория)
            default_branch = repo_data.get('default_branch', 'main')
            pages_status, pages_data = gh_request(
                f'https://api.github.com/repos/{repo_full_name}/pages', token,
                method='POST', payload={'source': {'branch': default_branch, 'path': '/'}}
            )
            if pages_status not in (200, 201, 409):  # 409 = уже включено
                pages_status2, pages_data2 = gh_request(
                    f'https://api.github.com/repos/{repo_full_name}/pages', token, method='GET'
                )
                if pages_status2 == 200:
                    pages_data = pages_data2

            pages_url = pages_data.get('html_url') or f"https://{gh_login}.github.io/{repo_name}/"
            repo_url = repo_data.get('html_url', f'https://github.com/{repo_full_name}')

            cur.execute(
                f"""UPDATE {schema}.projects
                    SET github_repo_url = %s, github_repo_name = %s, github_pages_url = %s
                    WHERE id = %s""",
                (repo_url, repo_name, pages_url, project_id)
            )
        conn.commit()
    finally:
        conn.close()

    return ok({
        'repo_url': repo_url,
        'repo_name': repo_name,
        'pages_url': pages_url,
    })
