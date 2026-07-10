"""Эндпоинт «Экспорт в код» (Фаза 1, Подход C).

POST /api/export-code  { "project_id": <id> }   заголовок X-Session-Id
→ 200 { filename, zip_b64, files }  — zip настоящего Next.js+Prisma проекта (base64).

LLM НЕ вызывается — экспорт детерминированный (compiler.py). Списывается ФИКСИРОВАННАЯ цена энергии
(RW_EXPORT_COST, по умолчанию 5). При ошибке сборки энергия возвращается.
server.py отдаёт тело как JSON, бинарь напрямую не поддержан → zip кодируем base64, фронт декодирует.
"""
import os
import re
import json
import base64
import urllib.request
import urllib.error

import psycopg2

import compiler  # backend/export-code/compiler.py (server.py кладёт папку функции в sys.path)

EXPORT_COST = int(os.environ.get('RW_EXPORT_COST', '5'))


def _schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def _resp(status, obj):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(obj, ensure_ascii=False)}


def get_user_id(session_id, schema):
    """Сессия → user_id (действующая, не истёкшая). Дубль тривиального хелпера из generate-site —
    ради независимости эндпоинта от гигантского модуля генерации."""
    if not session_id:
        return None
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
                        (session_id,))
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()


def _project_owner(project_id, schema):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT user_id FROM {schema}.projects WHERE id = %s", (project_id,))
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()


def _charge_energy(user_id, schema, cost):
    """Атомарно списывает `cost` единиц энергии. Возвращает True при успехе, False если не хватает."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT energy_balance FROM {schema}.users WHERE id = %s FOR UPDATE", (user_id,))
            row = cur.fetchone()
            if not row or row[0] is None or row[0] < cost:
                conn.commit()
                return False
            cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance - %s WHERE id = %s",
                        (cost, user_id))
        conn.commit()
        return True
    finally:
        conn.close()


def _refund_energy(user_id, schema, cost):
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance + %s WHERE id = %s",
                            (cost, user_id))
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass


def _github_creds(user_id, schema):
    """GitHub OAuth-токен пользователя + login (заполняются при входе через GitHub)."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT github_access_token, github_login FROM {schema}.users WHERE id = %s", (user_id,))
            r = cur.fetchone()
            return (r[0], r[1]) if r else (None, None)
    finally:
        conn.close()


def _slug_repo(name):
    b = re.sub(r'[^a-zA-Z0-9-]+', '-', (name or '').strip()).strip('-').lower()[:90]
    return b or 'roboweb-export'


def _gh(url, token, method='GET', payload=None):
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json',
        'User-Agent': 'Roboweb', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            b = r.read()
            return r.status, (json.loads(b) if b else {})
    except urllib.error.HTTPError as e:
        b = e.read()
        try:
            d = json.loads(b)
        except Exception:
            d = {'message': b.decode('utf-8', 'ignore')}
        return e.code, d


def _create_repo(token, name, title):
    """Создаёт НОВЫЙ публичный репозиторий (безопасно: чужой никогда не трогаем). При занятом имени — суффикс."""
    desc = (f'Экспорт кода из RoboWeb: {title}')[:250]
    st, repo = _gh('https://api.github.com/user/repos', token, 'POST',
                   {'name': name, 'description': desc, 'auto_init': False, 'private': False})
    if st in (200, 201):
        return repo
    import random
    import string
    name2 = name + '-' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
    st, repo = _gh('https://api.github.com/user/repos', token, 'POST',
                   {'name': name2, 'description': desc, 'auto_init': False, 'private': False})
    if st in (200, 201):
        return repo
    raise RuntimeError('repo create: ' + str(repo.get('message')))


def _push_tree(files, token, title, name):
    """Пушит дерево файлов первым коммитом в свежесозданный репозиторий. Возвращает (repo_url, repo_name)."""
    repo = _create_repo(token, name, title)
    full = repo.get('full_name')
    branch = repo.get('default_branch') or 'main'
    tree = [{'path': p, 'mode': '100644', 'type': 'blob', 'content': c} for p, c in files.items()]
    tst, td = _gh(f'https://api.github.com/repos/{full}/git/trees', token, 'POST', {'tree': tree})
    if tst not in (200, 201):
        raise RuntimeError('tree: ' + str(td.get('message')))
    cst, cd = _gh(f'https://api.github.com/repos/{full}/git/commits', token, 'POST',
                  {'message': 'Экспорт из RoboWeb', 'tree': td['sha']})
    if cst not in (200, 201):
        raise RuntimeError('commit: ' + str(cd.get('message')))
    rst, rr = _gh(f'https://api.github.com/repos/{full}/git/refs', token, 'POST',
                  {'ref': f'refs/heads/{branch}', 'sha': cd['sha']})
    if rst not in (200, 201):
        raise RuntimeError('ref: ' + str(rr.get('message')))
    return (repo.get('html_url') or f'https://github.com/{full}'), repo.get('name', name)


def handler(event, context):
    if (event.get('httpMethod') or 'GET').upper() != 'POST':
        return _resp(405, {'error': 'Метод не поддерживается'})
    headers = {(k or '').lower(): v for k, v in (event.get('headers') or {}).items()}
    schema = _schema()

    user_id = get_user_id(headers.get('x-session-id', ''), schema)
    if not user_id:
        return _resp(401, {'error': 'Требуется вход'})

    try:
        body = json.loads(event.get('body') or '{}')
    except (ValueError, TypeError):
        body = {}
    project_id = body.get('project_id')
    if not project_id:
        return _resp(400, {'error': 'Не указан project_id'})
    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        return _resp(400, {'error': 'Некорректный project_id'})

    owner = _project_owner(project_id, schema)
    if owner is None:
        return _resp(404, {'error': 'Проект не найден'})
    if owner != user_id:
        return _resp(403, {'error': 'Нет доступа к проекту'})

    target = str(body.get('target') or 'zip').lower()

    # GitHub требует подключённый OAuth-аккаунт — проверяем ДО списания энергии.
    if target == 'github':
        gh_token, gh_login = _github_creds(user_id, schema)
        if not gh_token or not gh_login:
            return _resp(428, {'error': 'Сначала подключите GitHub-аккаунт (войдите через GitHub на странице входа).'})

    if not _charge_energy(user_id, schema, EXPORT_COST):
        return _resp(402, {'error': f'Недостаточно энергии для экспорта (нужно {EXPORT_COST}). Пополните баланс.'})

    try:
        project = compiler.load_project(project_id)
        if not (project.get('html') or '').strip():
            _refund_energy(user_id, schema, EXPORT_COST)
            return _resp(422, {'error': 'В проекте пока нет сайта — сначала сгенерируйте его.'})

        if target == 'github':
            files = compiler.build_files(project)
            repo_name = _slug_repo((body.get('repo_name') or '').strip()
                                   or ((project.get('title') or 'roboweb-export') + '-code'))
            repo_url, repo_name = _push_tree(files, gh_token, project.get('title') or 'site', repo_name)
            return _resp(200, {'repo_url': repo_url, 'repo_name': repo_name,
                               'files': len(files), 'cost': EXPORT_COST})

        filename, zip_bytes = compiler.build_zip(project)
    except Exception as ex:
        _refund_energy(user_id, schema, EXPORT_COST)
        print(f'[export-code] build error ({target}): {repr(ex)[:300]}', flush=True)
        msg = 'Не удалось запушить в GitHub. Энергия возвращена.' if target == 'github' \
            else 'Не удалось собрать проект. Энергия возвращена.'
        return _resp(500, {'error': msg})

    return _resp(200, {
        'filename': filename,
        'zip_b64': base64.b64encode(zip_bytes).decode('ascii'),
        'files': len(compiler.build_files(project)),
        'cost': EXPORT_COST,
    })
