import os
import json
import re
import psycopg2


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }


def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def get_user_id(cur, schema, session_id):
    cur.execute(f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
    row = cur.fetchone()
    return row[0] if row else None


def check_project_owner(cur, schema, project_id, user_id):
    cur.execute(f"SELECT id FROM {schema}.projects WHERE id = %s AND user_id = %s", (project_id, user_id))
    return cur.fetchone() is not None


def valid_identifier(name: str) -> bool:
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]{0,63}$', name or ''))


def handler(event: dict, context) -> dict:
    """Ядро проекта: секреты (ключи/токены) и простая база данных (пользовательские таблицы и строки)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    session_id = headers.get('x-session-id', '')
    if not session_id:
        return err('Не авторизован', 401)

    schema = get_schema()
    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', '')
    project_id = params.get('project_id')
    body = json.loads(event.get('body') or '{}')

    if not project_id:
        project_id = body.get('project_id')
    if not resource:
        resource = body.get('resource', '')

    if not project_id:
        return err('Укажите project_id')

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            user_id = get_user_id(cur, schema, session_id)
            if not user_id:
                return err('Сессия истекла', 401)
            if not check_project_owner(cur, schema, project_id, user_id):
                return err('Проект не найден', 404)

            # ───────────────────────── SECRETS ─────────────────────────
            if resource == 'secrets':
                if method == 'GET':
                    cur.execute(
                        f"SELECT id, key_name, created_at FROM {schema}.project_secrets WHERE project_id = %s ORDER BY created_at DESC",
                        (project_id,)
                    )
                    secrets = [{'id': r[0], 'key_name': r[1], 'created_at': r[2].isoformat()} for r in cur.fetchall()]
                    return ok({'secrets': secrets})

                if method == 'POST':
                    key_name = (body.get('key_name') or '').strip()
                    key_value = body.get('key_value') or ''
                    if not valid_identifier(key_name):
                        return err('Имя ключа: только латинские буквы, цифры и подчёркивание')
                    if not key_value:
                        return err('Укажите значение секрета')
                    cur.execute(
                        f"""INSERT INTO {schema}.project_secrets (project_id, user_id, key_name, key_value)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (project_id, key_name) DO UPDATE SET key_value = EXCLUDED.key_value
                            RETURNING id, key_name, created_at""",
                        (project_id, user_id, key_name, key_value)
                    )
                    r = cur.fetchone()
                    conn.commit()
                    return ok({'secret': {'id': r[0], 'key_name': r[1], 'created_at': r[2].isoformat()}})

                if method == 'DELETE':
                    secret_id = params.get('id')
                    if not secret_id:
                        return err('Укажите id секрета')
                    cur.execute(
                        f"DELETE FROM {schema}.project_secrets WHERE id = %s AND project_id = %s",
                        (secret_id, project_id)
                    )
                    conn.commit()
                    return ok({'ok': True})

                return err('Метод не поддерживается', 405)

            # ───────────────────────── DB: TABLES ─────────────────────────
            if resource == 'tables':
                if method == 'GET':
                    cur.execute(
                        f"""SELECT t.id, t.table_name, t.columns, t.created_at,
                                   (SELECT COUNT(*) FROM {schema}.project_db_rows r WHERE r.table_id = t.id) as rows_count
                            FROM {schema}.project_db_tables t
                            WHERE t.project_id = %s ORDER BY t.created_at DESC""",
                        (project_id,)
                    )
                    tables = [
                        {'id': r[0], 'table_name': r[1], 'columns': r[2], 'created_at': r[3].isoformat(), 'rows_count': r[4]}
                        for r in cur.fetchall()
                    ]
                    return ok({'tables': tables})

                if method == 'POST':
                    table_name = (body.get('table_name') or '').strip()
                    columns = body.get('columns') or []
                    if not valid_identifier(table_name):
                        return err('Имя таблицы: только латинские буквы, цифры и подчёркивание')
                    if not isinstance(columns, list) or not columns:
                        return err('Укажите хотя бы одну колонку')
                    for c in columns:
                        if not isinstance(c, dict) or not valid_identifier(c.get('name', '')):
                            return err(f'Некорректное имя колонки: {c}')
                    cur.execute(
                        f"""INSERT INTO {schema}.project_db_tables (project_id, user_id, table_name, columns)
                            VALUES (%s, %s, %s, %s) RETURNING id, table_name, columns, created_at""",
                        (project_id, user_id, table_name, json.dumps(columns))
                    )
                    r = cur.fetchone()
                    conn.commit()
                    return ok({'table': {'id': r[0], 'table_name': r[1], 'columns': r[2], 'created_at': r[3].isoformat(), 'rows_count': 0}})

                if method == 'DELETE':
                    table_id = params.get('id')
                    if not table_id:
                        return err('Укажите id таблицы')
                    cur.execute(
                        f"SELECT id FROM {schema}.project_db_tables WHERE id = %s AND project_id = %s",
                        (table_id, project_id)
                    )
                    if not cur.fetchone():
                        return err('Таблица не найдена', 404)
                    cur.execute(f"DELETE FROM {schema}.project_db_rows WHERE table_id = %s", (table_id,))
                    cur.execute(f"DELETE FROM {schema}.project_db_tables WHERE id = %s", (table_id,))
                    conn.commit()
                    return ok({'ok': True})

                return err('Метод не поддерживается', 405)

            # ───────────────────────── DB: ROWS ─────────────────────────
            if resource == 'rows':
                table_id = params.get('table_id') or body.get('table_id')
                if not table_id:
                    return err('Укажите table_id')
                cur.execute(
                    f"SELECT id FROM {schema}.project_db_tables WHERE id = %s AND project_id = %s",
                    (table_id, project_id)
                )
                if not cur.fetchone():
                    return err('Таблица не найдена', 404)

                if method == 'GET':
                    cur.execute(
                        f"SELECT id, data, created_at, updated_at FROM {schema}.project_db_rows WHERE table_id = %s ORDER BY created_at DESC LIMIT 500",
                        (table_id,)
                    )
                    rows = [
                        {'id': r[0], 'data': r[1], 'created_at': r[2].isoformat(), 'updated_at': r[3].isoformat()}
                        for r in cur.fetchall()
                    ]
                    return ok({'rows': rows})

                if method == 'POST':
                    data = body.get('data') or {}
                    if not isinstance(data, dict):
                        return err('data должно быть объектом')
                    cur.execute(
                        f"INSERT INTO {schema}.project_db_rows (table_id, data) VALUES (%s, %s) RETURNING id, data, created_at, updated_at",
                        (table_id, json.dumps(data))
                    )
                    r = cur.fetchone()
                    conn.commit()
                    return ok({'row': {'id': r[0], 'data': r[1], 'created_at': r[2].isoformat(), 'updated_at': r[3].isoformat()}})

                if method == 'PUT':
                    row_id = body.get('id')
                    data = body.get('data') or {}
                    if not row_id:
                        return err('Укажите id строки')
                    cur.execute(
                        f"""UPDATE {schema}.project_db_rows SET data = %s, updated_at = NOW()
                            WHERE id = %s AND table_id = %s RETURNING id, data, created_at, updated_at""",
                        (json.dumps(data), row_id, table_id)
                    )
                    r = cur.fetchone()
                    if not r:
                        return err('Строка не найдена', 404)
                    conn.commit()
                    return ok({'row': {'id': r[0], 'data': r[1], 'created_at': r[2].isoformat(), 'updated_at': r[3].isoformat()}})

                if method == 'DELETE':
                    row_id = params.get('id')
                    if not row_id:
                        return err('Укажите id строки')
                    cur.execute(
                        f"DELETE FROM {schema}.project_db_rows WHERE id = %s AND table_id = %s",
                        (row_id, table_id)
                    )
                    conn.commit()
                    return ok({'ok': True})

                return err('Метод не поддерживается', 405)

            return err('Неизвестный resource. Ожидается: secrets, tables, rows')

    finally:
        conn.close()
