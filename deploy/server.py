"""
Единая точка входа для запуска всех backend-функций проекта на обычном VPS
(вместо облачных serverless-функций).

Как это работает:
- Каждая функция в /backend/<name>/index.py содержит функцию handler(event, context).
- Этот файл поднимает Flask-приложение и для каждой папки в /backend создаёт роут
  /api/<name>, который эмулирует event/context и вызывает handler() как есть,
  без изменения кода самих функций.

Запуск локально для проверки:
    pip install -r deploy/requirements.txt
    DATABASE_URL=postgresql://user:pass@localhost:5432/roboweb \
    MAIN_DB_SCHEMA=public \
    python deploy/server.py

В проде запускается через gunicorn (см. deploy/README.md):
    gunicorn -w 4 -b 127.0.0.1:8000 deploy.server:app
"""
import os
import sys
import json
import importlib.util
import types
from flask import Flask, request, Response, stream_with_context

BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')

app = Flask(__name__)


class SimpleContext:
    """Заменяет context, который платформа передавала в облачные функции."""
    def __init__(self, request_id: str):
        self.request_id = request_id


def load_function_module(func_name: str):
    """Импортирует backend/<func_name>/index.py как отдельный Python-модуль,
    добавляя папку функции в sys.path — это нужно для функций с доп. файлами
    (например blog-rss/articles_data.py)."""
    func_dir = os.path.join(BACKEND_DIR, func_name)
    index_path = os.path.join(func_dir, 'index.py')
    if not os.path.isfile(index_path):
        return None

    if func_dir not in sys.path:
        sys.path.insert(0, func_dir)

    module_name = f'backend_func_{func_name.replace("-", "_")}'
    spec = importlib.util.spec_from_file_location(module_name, index_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def discover_functions():
    """Находит все папки в /backend, где есть index.py (включая вложенные extensions/*)."""
    functions = {}
    for root, dirs, files in os.walk(BACKEND_DIR):
        if 'index.py' in files:
            rel = os.path.relpath(root, BACKEND_DIR)
            # URL-имя функции: заменяем разделители папок на дефис
            # backend/extensions/yookassa/yookassa -> yookassa
            # backend/auth -> auth
            name = os.path.basename(root)
            functions[name] = rel
    return functions


FUNCTIONS = discover_functions()
print(f'[deploy] Найдено backend-функций: {list(FUNCTIONS.keys())}')


def build_event() -> dict:
    """Конвертирует Flask request в формат event, который ожидают handler()-функции."""
    body = request.get_data(as_text=True) or ''
    return {
        'httpMethod': request.method,
        'headers': dict(request.headers),
        'queryStringParameters': dict(request.args) if request.args else {},
        'body': body,
        'isBase64Encoded': False,
        'requestContext': {
            'identity': {'sourceIp': request.remote_addr or ''}
        },
    }


def make_handler(func_name: str, rel_path: str):
    def view():
        module = load_function_module(rel_path)
        if module is None or not hasattr(module, 'handler'):
            return Response(json.dumps({'error': f'Function {func_name} not found'}), status=404, mimetype='application/json')

        event = build_event()
        context = SimpleContext(request_id=os.urandom(8).hex())

        try:
            result = module.handler(event, context)
        except Exception as e:
            # Детали ошибки — только в лог сервера; клиенту общий текст (иначе утечёт имя схемы,
            # структура запросов, traceback psycopg2 — помощь атакующему).
            print(f'[deploy] handler {func_name} error: {repr(e)[:400]}', flush=True)
            return Response(json.dumps({'error': 'Ошибка сервера'}), status=500, mimetype='application/json')

        # Стриминг (SSE): если handler вернул генератор в поле 'stream' — отдаём его как
        # потоковый ответ text/event-stream, не буферизуя. Используется generate-site для
        # живой сборки сайта в редакторе. stream_with_context сохраняет доступ к request
        # внутри генератора. X-Accel-Buffering:no отключает буферизацию в nginx.
        if isinstance(result, dict) and 'stream' in result:
            headers = result.get('headers', {}) or {}
            resp = Response(stream_with_context(result['stream']), status=result.get('statusCode', 200))
            for k, v in headers.items():
                resp.headers[k] = v
            return resp

        status = result.get('statusCode', 200)
        headers = result.get('headers', {}) or {}
        body = result.get('body', '')
        if not isinstance(body, str):
            body = json.dumps(body, ensure_ascii=False, default=str)

        resp = Response(body, status=status)
        for k, v in headers.items():
            resp.headers[k] = v
        return resp
    return view


for func_name, rel_path in FUNCTIONS.items():
    app.add_url_rule(
        f'/api/{func_name}',
        endpoint=func_name,
        view_func=make_handler(func_name, rel_path),
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    )


@app.route('/api/health')
def health():
    return {'status': 'ok', 'functions': list(FUNCTIONS.keys())}


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    # threaded=True — чтобы долгий SSE-стрим генерации не блокировал остальные запросы
    # (в проде эту роль выполняют gthread-воркеры gunicorn).
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
