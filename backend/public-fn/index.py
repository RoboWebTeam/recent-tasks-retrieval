"""Публичный вызов серверных функций проекта (Этап 2 фуллстека «Логика/API»).

Сайт-посетитель зовёт AI-сгенерированную функцию: POST {project_id, fn, args}. Код исполняется
в изолированном процессе (sandbox_runner.py: duktape, скрабленный env, RLIMIT, занул мостов).

Защиты (по чек-листу адверсариальной панели, блокеры):
  • глобальный семафор на число одновременных сабпроцессов (fail-fast 503);
  • rate-limit в двух измерениях: (project_id, fn) и IP;
  • prefetch ТОЛЬКО таблиц с public_read=true, коннект освобождается ДО сабпроцесса;
  • сабпроцесс killpg по стенному дедлайну, communicate (без pipe-deadlock), скрабленный env;
  • writes гейтятся public_write=true, только INSERT, санитизация ключей и приведение типов.
"""
import os
import sys
import json
import signal
import threading
import subprocess
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }


def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': data}


def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}


# ── Лимиты ────────────────────────────────────────────────────────────────
RUNNER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sandbox_runner.py')
# Число одновременных сабпроцессов НА ЭТОТ ВОРКЕР (в проде gunicorn -w4 → ×4). Fail-fast при переполнении.
_CONCURRENCY = int(os.environ.get('RW_FN_CONCURRENCY', '2'))
_SEM = threading.BoundedSemaphore(_CONCURRENCY)
WALL_TIMEOUT = 8          # стенной дедлайн (RLIMIT_CPU=4s внутри, это backstop)
MAX_ARGS_BYTES = 10 * 1024
MAX_ARGS_DEPTH = 32
MAX_READS = 5
MAX_PREFETCH_ROWS = 200
MAX_TABLES_BYTES = 256 * 1024
MAX_WRITES = 10
MAX_VALUE_LEN = 5000
FN_RATE_PER_MIN = 60      # на (project_id, fn)
IP_RATE_PER_MIN = 30      # на IP
_DANGER_KEYS = {'__proto__', 'constructor', 'prototype'}
_SAFE_ENV = {'PATH': os.environ.get('PATH', '/usr/bin'), 'LANG': 'C.UTF-8'}


def _valid_ident(name):
    import re
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]{0,63}$', name or ''))


def _json_depth(o, d=0):
    if d > MAX_ARGS_DEPTH + 1:
        return d
    if isinstance(o, dict):
        return max([_json_depth(v, d + 1) for v in o.values()] or [d])
    if isinstance(o, list):
        return max([_json_depth(v, d + 1) for v in o] or [d])
    return d


def _rate_limited(cur, schema, key, limit):
    """DELETE старых + COUNT + INSERT в окне 1 минута. Fail-closed при ошибке."""
    try:
        cur.execute(f"DELETE FROM {schema}.rate_limits WHERE key = %s AND created_at < NOW() - make_interval(mins => 1)", (key,))
        cur.execute(f"SELECT COUNT(*) FROM {schema}.rate_limits WHERE key = %s", (key,))
        if cur.fetchone()[0] >= limit:
            return True
        cur.execute(f"INSERT INTO {schema}.rate_limits (key) VALUES (%s)", (key,))
        return False
    except Exception:
        return True


def _coerce(value, ctype):
    if ctype == 'number':
        try:
            num = float(value)
        except (TypeError, ValueError):
            return None
        # без Infinity/NaN (JS-переполнение 9e999) и без гигантских чисел
        if num != num or num in (float('inf'), float('-inf')):
            return None
        return int(num) if num.is_integer() else num
    if ctype == 'boolean':
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in ('true', '1', 'yes', 'on', 'да')
    return str(value)[:MAX_VALUE_LEN]


def _run_sandbox(code, sandbox_input):
    """Запускает раннер в отдельной process-group со скрабленным env; killpg по дедлайну."""
    payload = json.dumps({'code': code, 'input': sandbox_input})
    try:
        p = subprocess.Popen(
            [sys.executable, RUNNER],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, env=dict(_SAFE_ENV), start_new_session=True,
        )
    except Exception as ex:
        return {'ok': False, 'error': 'sandbox spawn failed: %s' % repr(ex)[:80]}
    try:
        out, _err = p.communicate(payload, timeout=WALL_TIMEOUT)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(os.getpgid(p.pid), signal.SIGKILL)
        except Exception:
            p.kill()
        try:
            p.communicate(timeout=2)
        except Exception:
            pass
        return {'ok': False, 'error': 'timeout'}
    out = (out or '').strip()
    if not out:
        return {'ok': False, 'error': 'no output (killed by resource limit?)'}
    try:
        return json.loads(out.splitlines()[-1])
    except Exception:
        return {'ok': False, 'error': 'bad sandbox output'}


def handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}
    if event.get('httpMethod') != 'POST':
        return err('Метод не поддерживается', 405)

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    ip = (headers.get('x-forwarded-for', '').split(',')[0].strip()
          or (event.get('requestContext', {}).get('identity', {}) or {}).get('sourceIp', '') or 'unknown')
    try:
        body = json.loads(event.get('body') or '{}')
    except (json.JSONDecodeError, TypeError):
        return err('Некорректный формат данных запроса')

    project_id = body.get('project_id')
    fn = body.get('fn')
    args = body.get('args') if isinstance(body.get('args'), (dict, list)) else {}
    if not project_id or not fn:
        return err('Укажите project_id и fn')
    try:
        project_id = int(project_id)
    except (TypeError, ValueError):
        return err('Некорректный project_id')
    if not _valid_ident(fn):
        return err('Некорректное имя функции')
    if len(json.dumps(args)) > MAX_ARGS_BYTES or _json_depth(args) > MAX_ARGS_DEPTH:
        return err('Слишком большие или глубоко вложенные аргументы')

    schema = get_schema()

    # Фаза БД №1: rate-limit, загрузка функции, prefetch публичных таблиц. Затем коннект ЗАКРЫВАЕМ.
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if _rate_limited(cur, schema, f'fn:{project_id}:{fn}', FN_RATE_PER_MIN) or \
               _rate_limited(cur, schema, f'fnip:{ip}:{project_id}', IP_RATE_PER_MIN):
                conn.commit()
                return err('Слишком много вызовов, попробуйте позже', 429)
            conn.commit()

            cur.execute(
                f"""SELECT code, reads FROM {schema}.project_functions
                    WHERE project_id = %s AND name = %s AND enabled = true""",
                (project_id, fn)
            )
            row = cur.fetchone()
            if not row:
                return err('Функция не найдена', 404)
            code, reads = row
            reads = reads if isinstance(reads, list) else []

            # prefetch: только таблицы проекта с public_read=true; общий объём ограничен.
            tables = {}
            total = 0
            for tname in reads[:MAX_READS]:
                if not _valid_ident(tname):
                    continue
                cur.execute(
                    f"""SELECT id FROM {schema}.project_db_tables
                        WHERE project_id = %s AND table_name = %s AND public_read = true""",
                    (project_id, tname)
                )
                tr = cur.fetchone()
                if not tr:
                    continue
                cur.execute(
                    f"SELECT data FROM {schema}.project_db_rows WHERE table_id = %s ORDER BY created_at DESC LIMIT %s",
                    (tr[0], MAX_PREFETCH_ROWS)
                )
                rows = [{'data': r[0]} for r in cur.fetchall()]
                chunk = len(json.dumps(rows))
                if total + chunk > MAX_TABLES_BYTES:
                    break
                total += chunk
                tables[tname] = rows
    finally:
        conn.close()  # КРИТИЧНО: не держим коннект во время исполнения сабпроцесса

    # Фаза исполнения: сабпроцесс под семафором (fail-fast 503), без открытого коннекта.
    if not _SEM.acquire(timeout=0.05):
        return err('Сервис занят, повторите через мгновение', 503)
    try:
        sandbox = _run_sandbox(code, {'args': args, 'tables': tables})
    finally:
        _SEM.release()

    if not sandbox.get('ok'):
        return err('Функция не выполнилась: ' + str(sandbox.get('error', 'error'))[:120], 400)

    ret = sandbox.get('result')
    if isinstance(ret, dict) and ('writes' in ret or 'result' in ret):
        client_result = ret.get('result')
        writes = ret.get('writes') if isinstance(ret.get('writes'), list) else []
    else:
        client_result, writes = ret, []

    # Фаза БД №2: применяем writes (только public_write, санитизация, приведение типов).
    applied = 0
    if writes:
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                for w in writes[:MAX_WRITES]:
                    if not isinstance(w, dict):
                        continue
                    tname = w.get('table')
                    data = w.get('data')
                    if not _valid_ident(tname) or not isinstance(data, dict):
                        continue
                    cur.execute(
                        f"""SELECT id, columns FROM {schema}.project_db_tables
                            WHERE project_id = %s AND table_name = %s AND public_write = true""",
                        (project_id, tname)
                    )
                    tr = cur.fetchone()
                    if not tr:
                        continue
                    col_types = {c.get('name'): c.get('type', 'text')
                                 for c in (tr[1] or []) if isinstance(c, dict)}
                    clean = {}
                    for k, v in data.items():
                        if k in _DANGER_KEYS or k not in col_types:
                            continue
                        cv = _coerce(v, col_types[k])
                        if cv is not None:
                            clean[k] = cv
                    if not clean:
                        continue
                    cur.execute(
                        f"INSERT INTO {schema}.project_db_rows (table_id, data) VALUES (%s, %s)",
                        (tr[0], json.dumps(clean))
                    )
                    applied += 1
            conn.commit()
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
        finally:
            conn.close()

    return ok({'ok': True, 'result': client_result, 'writes_applied': applied})
