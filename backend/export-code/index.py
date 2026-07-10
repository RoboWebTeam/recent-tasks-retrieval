"""Эндпоинт «Экспорт в код» (Фаза 1, Подход C).

POST /api/export-code  { "project_id": <id> }   заголовок X-Session-Id
→ 200 { filename, zip_b64, files }  — zip настоящего Next.js+Prisma проекта (base64).

LLM НЕ вызывается — экспорт детерминированный (compiler.py). Списывается ФИКСИРОВАННАЯ цена энергии
(RW_EXPORT_COST, по умолчанию 5). При ошибке сборки энергия возвращается.
server.py отдаёт тело как JSON, бинарь напрямую не поддержан → zip кодируем base64, фронт декодирует.
"""
import os
import json
import base64

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

    if not _charge_energy(user_id, schema, EXPORT_COST):
        return _resp(402, {'error': f'Недостаточно энергии для экспорта (нужно {EXPORT_COST}). Пополните баланс.'})

    try:
        project = compiler.load_project(project_id)
        if not (project.get('html') or '').strip():
            _refund_energy(user_id, schema, EXPORT_COST)
            return _resp(422, {'error': 'В проекте пока нет сайта — сначала сгенерируйте его.'})
        filename, zip_bytes = compiler.build_zip(project)
    except Exception as ex:
        _refund_energy(user_id, schema, EXPORT_COST)
        print(f'[export-code] build error: {repr(ex)[:300]}', flush=True)
        return _resp(500, {'error': 'Не удалось собрать проект. Энергия возвращена.'})

    return _resp(200, {
        'filename': filename,
        'zip_b64': base64.b64encode(zip_bytes).decode('ascii'),
        'files': len(compiler.build_files(project)),
        'cost': EXPORT_COST,
    })
