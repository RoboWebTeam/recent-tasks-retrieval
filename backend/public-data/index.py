import os
import json
import psycopg2


# ─────────────────────────────────────────────────────────────────────────────
# ПУБЛИЧНЫЙ DATA-API сгенерированных сайтов (Этап 1 фуллстека «Данные»).
#
# Сгенерированный сайт (JS в одном HTML-файле, исполняется в sandbox-iframe с
# allow-same-origin на origin платформы) читает КАТАЛОГИ и пишет ЗАЯВКИ/БРОНИ в
# виртуальные таблицы своего проекта (project_db_tables/project_db_rows) — БЕЗ сессии
# владельца. Доступ строго ограничен:
#   • только таблицы, ЯВНО помеченные public_read / public_write в маркере ROBOWEB_SCHEMA;
#   • изоляция по project_id → table (чужую таблицу не достать);
#   • на запись принимаются ТОЛЬКО поля из write_fields (белый список), с приведением типов;
#   • только два действия — GET (чтение) и POST (вставка). Ни DELETE, ни PUT, ни DDL.
#   • анти-спам: лимит вставок в таблицу за окно времени + ограничение размера тела.
# Приватный project-core (за X-Session-Id владельца) НЕ трогаем — это параллельный путь.
# ─────────────────────────────────────────────────────────────────────────────

MAX_LIMIT = 200
DEFAULT_LIMIT = 50
MAX_FIELDS = 20            # не больше полей в одной заявке
MAX_TEXT_LEN = 5000        # обрезаем длинные текстовые значения
INSERT_WINDOW_SEC = 60     # окно анти-спама
INSERT_WINDOW_MAX = 30     # макс. вставок в таблицу за окно


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }


def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': data}


def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


def _coerce(value, ctype):
    """Приводит присланное значение к типу колонки; None — если значение непригодно."""
    if ctype == 'number':
        try:
            num = float(value)
        except (TypeError, ValueError):
            return None
        return int(num) if num.is_integer() else num
    if ctype == 'boolean':
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in ('true', '1', 'yes', 'on', 'да')
    # text (и всё неизвестное)
    return str(value)[:MAX_TEXT_LEN]


def handler(event: dict, context) -> dict:
    """Публичное чтение каталогов и приём заявок для сгенерированных сайтов."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = get_schema()
    params = event.get('queryStringParameters') or {}
    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        return err('Некорректный формат данных запроса', 400)

    project_id = params.get('project_id') or body.get('project_id')
    table_name = params.get('table') or body.get('table')
    if not project_id or not table_name:
        return err('Укажите project_id и table')
    try:
        project_id = int(project_id)
    except (TypeError, ValueError):
        return err('Некорректный project_id')

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Проект должен существовать (черновик/опубликованный — не важно: доступ гейтят
            # именно флаги public_read/public_write, чтобы работало и превью в редакторе).
            cur.execute(f"SELECT id FROM {schema}.projects WHERE id = %s", (project_id,))
            if not cur.fetchone():
                return err('Не найдено', 404)

            # Таблица проекта + её флаги публичности. Имя таблицы идёт в SQL как ЗНАЧЕНИЕ (%s),
            # а не как идентификатор — инъекция через table_name невозможна.
            cur.execute(
                f"""SELECT id, columns, public_read, public_write, write_fields
                    FROM {schema}.project_db_tables
                    WHERE project_id = %s AND table_name = %s""",
                (project_id, table_name)
            )
            trow = cur.fetchone()
            if not trow:
                return err('Не найдено', 404)
            table_id, columns, public_read, public_write, write_fields = trow
            columns = columns or []
            write_fields = write_fields or []
            col_types = {c.get('name'): c.get('type', 'text') for c in columns if isinstance(c, dict)}

            # ─────────────── ЧТЕНИЕ КАТАЛОГА ───────────────
            if method == 'GET':
                if not public_read:
                    return err('Не найдено', 404)  # маскируем существование приватной таблицы
                try:
                    limit = int(params.get('limit') or DEFAULT_LIMIT)
                except (TypeError, ValueError):
                    limit = DEFAULT_LIMIT
                limit = max(1, min(limit, MAX_LIMIT))
                cur.execute(
                    f"""SELECT id, data, created_at FROM {schema}.project_db_rows
                        WHERE table_id = %s ORDER BY created_at DESC LIMIT %s""",
                    (table_id, limit)
                )
                rows = [
                    {'id': r[0], 'data': r[1], 'created_at': r[2].isoformat()}
                    for r in cur.fetchall()
                ]
                public_cols = [
                    {'name': c.get('name'), 'type': c.get('type', 'text'), 'label': c.get('label')}
                    for c in columns if isinstance(c, dict)
                ]
                return ok({'rows': rows, 'columns': public_cols})

            # ─────────────── ЗАПИСЬ ЗАЯВКИ/БРОНИ ───────────────
            if method == 'POST':
                if not public_write:
                    return err('Запись в эту таблицу недоступна', 403)

                incoming = body.get('data')
                if not isinstance(incoming, dict):
                    return err('data должно быть объектом')
                if len(incoming) > MAX_FIELDS:
                    return err('Слишком много полей')

                # Белый список полей: write_fields, а если не задан — все колонки таблицы.
                allowed = set(write_fields) if write_fields else set(col_types.keys())
                clean = {}
                for key, val in incoming.items():
                    if key not in allowed:
                        continue  # неизвестные/служебные ключи отбрасываем
                    coerced = _coerce(val, col_types.get(key, 'text'))
                    if coerced is not None:
                        clean[key] = coerced
                if not clean:
                    return err('Пустая заявка: заполните поля формы')

                # Анти-спам: не больше INSERT_WINDOW_MAX вставок в эту таблицу за окно.
                # INSERT_WINDOW_SEC — наша целочисленная константа (не пользовательский ввод),
                # поэтому её можно безопасно вставить в INTERVAL напрямую (внутри литерала %s не биндится).
                cur.execute(
                    f"""SELECT COUNT(*) FROM {schema}.project_db_rows
                        WHERE table_id = %s AND created_at > NOW() - INTERVAL '{int(INSERT_WINDOW_SEC)} seconds'""",
                    (table_id,)
                )
                if cur.fetchone()[0] >= INSERT_WINDOW_MAX:
                    return err('Слишком много заявок, попробуйте позже', 429)

                cur.execute(
                    f"INSERT INTO {schema}.project_db_rows (table_id, data) VALUES (%s, %s) RETURNING id",
                    (table_id, json.dumps(clean))
                )
                row_id = cur.fetchone()[0]
                conn.commit()
                return ok({'ok': True, 'id': row_id})

            return err('Метод не поддерживается', 405)

    except Exception:
        conn.rollback()
        return err('Ошибка обработки запроса', 500)
    finally:
        conn.close()
