"""Общий «контракт разметки» RoboWeb — чистые парсеры декларативной разметки data-rw-* и служебных
маркеров (ROBOWEB_SCHEMA, RW_FN, RW-RUNTIME). Без БД, env, сети и LLM — только re/json.

Единый источник истины для генератора (generate-site) и экспортёра кода (export-code): оба должны
одинаково понимать формат разметки. Раньше эти функции жили в самом активно-редактируемом файле
generate-site/index.py — при любой правке формата маркеров экспортёр молча ломался бы. Вынесено сюда
(Фаза 0 «Экспорта в код») + зафиксировано golden-тестами (test_rw_markup.py), чтобы поведение не дрейфовало.
"""
import re
import json


def _valid_db_identifier(name: str) -> bool:
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]{0,63}$', name or ''))


def extract_schema_block(html: str):
    """Достаёт маркер <!--ROBOWEB_SCHEMA:{...}--> (модель ставит его после </html>).
    Возвращает (html_без_маркера, list_таблиц). Нет маркера/битый JSON → (html, [])."""
    m = re.search(r'<!--\s*ROBOWEB_SCHEMA:(.*?)-->', html, re.DOTALL)
    if not m:
        return html, []
    cleaned = (html[:m.start()] + html[m.end():]).strip()
    raw = m.group(1).strip()
    s = raw.find('{'); e = raw.rfind('}')
    if s == -1 or e == -1:
        return cleaned, []
    try:
        parsed = json.loads(raw[s:e + 1])
        tables = parsed.get('tables', []) if isinstance(parsed, dict) else []
    except (ValueError, TypeError):
        tables = []
    return cleaned, tables if isinstance(tables, list) else []


def strip_injected_runtime(html):
    """Убирает ранее вставленный платформой runtime-скрипт (window.rw…) из HTML — чтобы на правках
    модель не воспроизводила его (портит минифицированный JS → сломанный <script> → краш превью)
    и не тратила на него токены. Runtime заново вставит inject_data_runtime после генерации.
    Ловит и по маркеру (новые сайты), и по сигнатуре window.rw (старые, без маркера)."""
    if not html:
        return html
    html = re.sub(r'<!--\s*RW-RUNTIME\s*-->.*?<!--\s*/RW-RUNTIME\s*-->', '', html, flags=re.DOTALL)

    def _drop(m):
        blob = m.group(0)
        return '' if ('window.rw' in blob or 'rw.__spa' in blob or '/api/public-data' in blob) else blob
    html = re.sub(r'<script\b[^>]*>.*?</script>', _drop, html, flags=re.DOTALL | re.IGNORECASE)
    return html


def derive_schema_from_html(html):
    """Выводит таблицы БД прямо из декларативной разметки сайта (data-rw-table на форме,
    data-rw-catalog + data-rw-field в <template>). Это ОСНОВНОЙ механизм: он работает, даже
    если модель не выдала отдельный невидимый маркер ROBOWEB_SCHEMA (что она делает ненадёжно).
    Модель пишет только видимую разметку — бэкенд сам понимает, какие таблицы нужны."""
    if not html:
        return []
    tables, seen = [], set()
    # Формы записи: <form ... data-rw-table="Y" ...> ... name="..." ... </form>
    for fm in re.finditer(r'<form\b[^>]*\bdata-rw-table=["\']([^"\']+)["\'][^>]*>(.*?)</form>',
                          html, re.IGNORECASE | re.DOTALL):
        tname = fm.group(1).strip()
        if not _valid_db_identifier(tname) or tname in seen:
            continue
        fields = []
        for nm in re.finditer(r'\bname=["\']([^"\']+)["\']', fm.group(2)):
            fn = nm.group(1).strip()
            if _valid_db_identifier(fn) and fn not in fields:
                fields.append(fn)
        if not fields:
            continue
        seen.add(tname)
        tables.append({'table_name': tname, 'label': tname,
                       'columns': [{'name': f, 'type': 'text'} for f in fields],
                       'public_write': True, 'public_read': False, 'write_fields': fields})
    # Fallback: обычные <form> БЕЗ data-rw-table (модель забыла атрибут) — сводим в одну таблицу
    # заявок "zayavki", чтобы присланные данные не терялись. Только настоящие формы-заявки:
    # есть submit-кнопка и минимум 2 именованных поля (чтобы не задеть поиск/подписку одним полем).
    untagged = []
    for fm in re.finditer(r'<form\b(?![^>]*data-rw-table)[^>]*>(.*?)</form>', html, re.IGNORECASE | re.DOTALL):
        block = fm.group(1)
        if not re.search(r'type=["\']submit["\']|<button', block, re.IGNORECASE):
            continue
        names = [n.group(1).strip() for n in re.finditer(r'\bname=["\']([^"\']+)["\']', block)]
        names = [n for n in names if _valid_db_identifier(n)]
        if len(names) < 2:
            continue
        for n in names:
            if n not in untagged:
                untagged.append(n)
    if untagged and 'zayavki' not in seen:
        seen.add('zayavki')
        tables.append({'table_name': 'zayavki', 'label': 'Заявки с сайта',
                       'columns': [{'name': f, 'type': 'text'} for f in untagged],
                       'public_write': True, 'public_read': False, 'write_fields': untagged})
    # Каталоги чтения: data-rw-catalog="X" + ближайший <template data-rw-item> с data-rw-field
    for cm in re.finditer(r'data-rw-catalog=["\']([^"\']+)["\']', html, re.IGNORECASE):
        tname = cm.group(1).strip()
        if not _valid_db_identifier(tname) or tname in seen:
            continue
        tpl = re.search(r'<template\b[^>]*\bdata-rw-item\b[^>]*>(.*?)</template>',
                        html[cm.end():], re.IGNORECASE | re.DOTALL)
        fields = []
        if tpl:
            for fm2 in re.finditer(r'data-rw-field=["\']([^"\']+)["\']', tpl.group(1)):
                fn = fm2.group(1).strip()
                if _valid_db_identifier(fn) and fn not in fields:
                    fields.append(fn)
        if not fields:
            fields = ['title', 'descr', 'price', 'photo']
        seen.add(tname)
        tables.append({'table_name': tname, 'label': tname,
                       'columns': [{'name': f, 'type': 'text'} for f in fields],
                       'public_read': True, 'public_write': False})
    # Личные кабинеты: data-rw-cabinet="X" — таблица СВОИХ строк посетителя (owner_scoped, НЕ public_read).
    for cm in re.finditer(r'data-rw-cabinet=["\']([^"\']+)["\']', html, re.IGNORECASE):
        tname = cm.group(1).strip()
        if not _valid_db_identifier(tname) or tname in seen:
            continue
        tpl = re.search(r'<template\b[^>]*\bdata-rw-item\b[^>]*>(.*?)</template>',
                        html[cm.end():], re.IGNORECASE | re.DOTALL)
        fields = []
        if tpl:
            for fm3 in re.finditer(r'data-rw-field=["\']([^"\']+)["\']', tpl.group(1)):
                fn = fm3.group(1).strip()
                if _valid_db_identifier(fn) and fn not in fields:
                    fields.append(fn)
        if not fields:
            fields = ['item', 'qty', 'price', 'status', 'date']
        seen.add(tname)
        tables.append({'table_name': tname, 'label': tname,
                       'columns': [{'name': f, 'type': 'text'} for f in fields],
                       'public_read': False, 'public_write': False, 'owner_scoped': True})
    return tables


def merge_schema(primary, derived):
    """Объединяет таблицы из маркера (primary, приоритет) с выведенными из разметки (derived)."""
    primary = primary if isinstance(primary, list) else []
    names = {t.get('table_name') for t in primary if isinstance(t, dict)}
    return primary + [t for t in derived if t.get('table_name') not in names]


def extract_fn_blocks(html):
    """Линейным сканом (НЕ backtracking-regex — защита от ReDoS) достаёт блоки серверных функций:
    <!--RW_FN name="calc" reads="prices" desc="..."-->function handler(input){...}<!--/RW_FN-->
    Возвращает (html_без_блоков, list функций). Дубли name отбрасываем (не last-wins)."""
    if not html or '<!--RW_FN' not in html:
        return html, []
    OPEN, CLOSE = '<!--RW_FN', '<!--/RW_FN-->'
    out_parts, fns, seen = [], [], set()
    pos, last = 0, 0
    scanned = 0
    while True:
        i = html.find(OPEN, pos)
        if i == -1 or scanned > 30:  # не больше 30 блоков за проход
            break
        scanned += 1
        head_end = html.find('-->', i)
        if head_end == -1:
            break
        close = html.find(CLOSE, head_end)
        if close == -1:
            break
        head = html[i:head_end]
        code = html[head_end + 3:close]
        pos = close + len(CLOSE)
        # ЛЮБОЙ найденный блок вырезаем из HTML (даже отклонённый) — маркеры не должны утечь в сайт.
        out_parts.append(html[last:i])
        last = pos
        name_m = re.search(r'name="([a-zA-Z0-9_]{1,40})"', head)
        if not name_m:
            continue
        name = name_m.group(1)
        if name in seen or not _valid_db_identifier(name) or len(code) > 20000:
            continue
        if OPEN in code:   # тело не должно содержать вложенный открывающий маркер
            continue
        reads_m = re.search(r'reads="([^"]*)"', head)
        reads = [r.strip() for r in (reads_m.group(1).split(',') if reads_m else []) if _valid_db_identifier(r.strip())][:5]
        desc_m = re.search(r'desc="([^"]{0,300})"', head)
        seen.add(name)
        fns.append({'name': name, 'reads': reads, 'code': code.strip(),
                    'description': (desc_m.group(1) if desc_m else '')})
    out_parts.append(html[last:])
    return ''.join(out_parts).strip(), fns
