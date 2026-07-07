"""Изолированный исполнитель серверных функций проекта (Этап 2 фуллстека).

Запускается endpoint'ом public-fn как ОТДЕЛЬНЫЙ короткоживущий процесс (один вызов = один процесс),
со скрабленным окружением (без секретов) и жёсткими rlimit. Читает {code, input} из stdin,
исполняет JS в duktape/dukpy и печатает {ok, result|error} в stdout.

Модель угроз (проверена PoC панелью безопасности):
  • dukpy инжектит process.env = dict(os.environ) и мосты call_python/require, читающие файлы с диска.
    → чистим os.environ ПЕРЕД созданием интерпретатора И зануляем все мосты в ТОМ ЖЕ evaljs, что и код
      (dukpy переинжектит их на каждый evaljs, поэтому занул в отдельном вызове не держится).
  • нет внутреннего таймаута, memory-бомба s+=s раздувается мгновенно.
    → RLIMIT_CPU (реальное CPU-время) + RLIMIT_AS (адресное пространство) + RLIMIT_FSIZE=0 + RLIMIT_NPROC.
  • duktape не имеет доступа к сети по построению; файловые мосты сняты; env пуст.
"""
import sys
import os
import json

# 1) Скрабим окружение ДО импорта/создания dukpy — dukpy копирует dict(os.environ) в process.env.
_SAFE_ENV = {'PATH': os.environ.get('PATH', '/usr/bin'), 'LANG': 'C.UTF-8'}
os.environ.clear()
os.environ.update(_SAFE_ENV)

MAX_OUTPUT = 100 * 1024   # ≤100KB результата


def _set_limits():
    """Жёсткие лимиты ресурсов процесса-исполнителя (Linux/Docker их применяет; на macOS частично)."""
    try:
        import resource
    except Exception:
        return
    def _lim(what, soft, hard):
        try:
            resource.setrlimit(what, (soft, hard))
        except Exception:
            pass
    # Память: 512MB виртуального адресного пространства — ловит строчную/массивную бомбу до OOM хоста,
    # но оставляет запас самому python (он резервирует крупные виртуальные арены).
    _lim(resource.RLIMIT_AS, 512 * 1024 * 1024, 512 * 1024 * 1024)
    # CPU-время (не стенное): SIGXCPU при 4s реального CPU — устойчиво к переподписке ядер.
    _lim(resource.RLIMIT_CPU, 4, 5)
    # Запрет создания файлов. (RLIMIT_NPROC не трогаем: он per-user и может помешать python-потокам;
    # форк из duktape и так невозможен — мосты call_python/require занулены.)
    _lim(resource.RLIMIT_FSIZE, 0, 0)


# Занул мостов + чтение входа — ВСЁ в одном evaljs вместе с кодом функции.
_NEUTRALIZE = (
    "var __RW_IN__=(typeof dukpy!=='undefined'&&dukpy)?dukpy['rw_input']:null;"
    "call_python=void 0;require=void 0;_dukpy=void 0;_require_set_module_id=void 0;"
    "process=void 0;module=void 0;exports=void 0;dukpy=void 0;"
    "try{Duktape.modSearch=void 0;Duktape.modLoaded=void 0;}catch(__e){}"
)


def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw or '{}')
    except Exception:
        print(json.dumps({'ok': False, 'error': 'bad payload'}))
        return
    code = payload.get('code') or ''
    rw_input = payload.get('input') or {}
    if not isinstance(code, str) or len(code) > 20000:
        print(json.dumps({'ok': False, 'error': 'bad code'}))
        return

    _set_limits()
    try:
        import dukpy
    except Exception as ex:
        print(json.dumps({'ok': False, 'error': 'sandbox unavailable: %s' % repr(ex)[:80]}))
        return

    # Обёртка: занул мостов → код функции → вызов handler(__RW_IN__) → JSON.
    script = (
        _NEUTRALIZE + "\n" + code +
        "\n;(function(){"
        "  if(typeof handler!=='function'){return JSON.stringify({__rw_err:'no handler'});}"
        "  var __r=handler(__RW_IN__);"
        "  return JSON.stringify({__rw_ok:__r===undefined?null:__r});"
        "})();"
    )
    try:
        out = dukpy.evaljs(script, rw_input=rw_input)
    except MemoryError:
        print(json.dumps({'ok': False, 'error': 'memory limit'}))
        return
    except Exception as ex:
        print(json.dumps({'ok': False, 'error': ('js error: ' + repr(ex)[:160])}))
        return

    if not isinstance(out, str):
        out = json.dumps(out)
    if len(out) > MAX_OUTPUT:
        print(json.dumps({'ok': False, 'error': 'result too large'}))
        return
    try:
        parsed = json.loads(out)
    except Exception:
        print(json.dumps({'ok': False, 'error': 'bad result'}))
        return
    if isinstance(parsed, dict) and '__rw_err' in parsed:
        print(json.dumps({'ok': False, 'error': str(parsed['__rw_err'])[:160]}))
        return
    result = parsed.get('__rw_ok') if isinstance(parsed, dict) else None
    print(json.dumps({'ok': True, 'result': result}, ensure_ascii=False))


if __name__ == '__main__':
    main()
