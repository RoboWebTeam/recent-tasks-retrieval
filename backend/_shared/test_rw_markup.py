"""Golden-тесты «контракта разметки» (backend/_shared/rw_markup.py).

Эталон golden_rw_markup.json снят с ПРЕЖНЕЙ реализации (когда парсеры жили в generate-site/index.py).
Тест гарантирует, что вынос в общий модуль и любые будущие правки не меняют поведение молча.

Запуск:  python backend/_shared/test_rw_markup.py   (без внешних зависимостей; exit != 0 при провале)
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _shared import rw_markup as rw  # noqa: E402

GOLDEN = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'golden_rw_markup.json'),
                        encoding='utf-8'))

# Те же входы, что использовались при снятии эталона (см. историю генерации golden).
S = {
    'catalog': '<div data-rw-catalog="menu_items"><div data-rw-items></div><template data-rw-item><img data-rw-field="photo"><h3 data-rw-field="title"></h3><span data-rw-field="price"></span></template></div>',
    'form': '<form data-rw-table="bookings"><input name="name"><input name="phone"><textarea name="comment"></textarea></form>',
    'cabinet': '<div data-rw-cabinet="orders"><div data-rw-items></div><template data-rw-item><b data-rw-field="item"></b><span data-rw-field="qty"></span></template></div>',
    'plainform': '<form><input name="email"><input name="msg"></form>',
    'runtime_marker': '<body>hi<!--RW-RUNTIME--><script>(function(){window.rw={x:1};})();</script><!--/RW-RUNTIME--><p>tail</p></body>',
    'runtime_legacy': '<script>var a=1;window.rw=5;</script><script>console.log("keep me")</script>',
    'schema_marker': '<html><body>x</body></html>\n<!--ROBOWEB_SCHEMA:{"tables":[{"table_name":"leads","columns":[{"name":"email","type":"text"}],"public_write":true}]}-->',
    'fn_block': 'A<!--RW_FN name="calc_x" reads="prices, bad-name" desc="Расчёт"-->function handler(input){ return { result: 1 }; }<!--/RW_FN-->B',
}

failures = []


def check(name, got, expected):
    if got == expected:
        print(f'  ok  {name}')
    else:
        failures.append(name)
        print(f'  FAIL {name}\n     got:      {got!r}\n     expected: {expected!r}')


# strip_injected_runtime
for k in ('runtime_marker', 'runtime_legacy', 'plainform'):
    check(f'strip_injected_runtime[{k}]', rw.strip_injected_runtime(S[k]),
          GOLDEN['strip_injected_runtime'][k])

# derive_schema_from_html
for k in ('catalog', 'form', 'cabinet', 'plainform'):
    check(f'derive_schema_from_html[{k}]', rw.derive_schema_from_html(S[k]),
          GOLDEN['derive_schema_from_html'][k])

# extract_schema_block
c, t = rw.extract_schema_block(S['schema_marker'])
check('extract_schema_block[schema_marker]', {'cleaned': c, 'tables': t},
      GOLDEN['extract_schema_block']['schema_marker'])

# extract_fn_blocks
c2, f = rw.extract_fn_blocks(S['fn_block'])
check('extract_fn_blocks[fn_block]', {'cleaned': c2, 'fns': f},
      GOLDEN['extract_fn_blocks']['fn_block'])

# merge_schema
check('merge_schema[basic]',
      rw.merge_schema([{'table_name': 'a'}], [{'table_name': 'a'}, {'table_name': 'b'}]),
      GOLDEN['merge_schema']['basic'])

# _valid_db_identifier
for s, expected in GOLDEN['_valid_db_identifier'].items():
    check(f'_valid_db_identifier[{s!r}]', rw._valid_db_identifier(s), expected)

if failures:
    print(f'\n{len(failures)} проверок ПРОВАЛЕНО: {failures}')
    sys.exit(1)
print('\nвсе golden-проверки пройдены')
