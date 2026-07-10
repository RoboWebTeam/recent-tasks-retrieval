"""RoboWeb → «Экспорт в код» (Подход C, PoC Фазы 1).

Детерминированный компилятор: берёт уже сгенерированный сайт проекта (html_content),
его таблицы (project_db_tables) и серверные функции (project_functions) и собирает
НАСТОЯЩИЙ переносимый Next.js (App Router) + Prisma проект. LLM НЕ вызывается.

PoC-объём (Фаза 1): статический лендинг 1-в-1, формы data-rw-table → Postgres через Prisma,
каталоги data-rw-catalog → серверное чтение, серверные функции RW_FN → /api/fn/<name>.
НЕ покрыто (честно, Фаза 2): аккаунты data-rw-auth, кабинет data-rw-cabinet, корзина/checkout-UI.

Запуск (локально):  python compiler.py <project_id> <output_dir>
Читает БД по DATABASE_URL + MAIN_DB_SCHEMA (как остальные функции платформы).
"""
import os
import re
import sys
import json

# Общий «контракт разметки» (Фаза 0): те же чистые парсеры, что и у генератора — без загрузки
# гигантского generate-site/index.py. server.py кладёт в sys.path папку функции; добавляем backend/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _shared import rw_markup  # noqa: E402

import psycopg2


def _schema():
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def _pascal(name):
    return ''.join(p.capitalize() for p in re.split(r'[^a-zA-Z0-9]+', name) if p) or 'Model'


def load_project(project_id):
    """Читает html + таблицы + функции проекта из БД."""
    sch = _schema()
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(f'SELECT title, description, html_content FROM {sch}.projects WHERE id=%s', (project_id,))
        row = cur.fetchone()
        if not row:
            raise SystemExit(f'проект {project_id} не найден')
        title, description, html = row
        cur.execute(f'SELECT table_name, columns, public_read, public_write, owner_scoped '
                    f'FROM {sch}.project_db_tables WHERE project_id=%s ORDER BY table_name', (project_id,))
        tables = [{'name': r[0], 'columns': r[1] if isinstance(r[1], list) else json.loads(r[1] or '[]'),
                   'public_read': r[2], 'public_write': r[3], 'owner_scoped': r[4]} for r in cur.fetchall()]
        fns = []
        try:
            cur.execute(f'SELECT name, code, reads FROM {sch}.project_functions WHERE project_id=%s', (project_id,))
            for r in cur.fetchall():
                reads = r[2] if isinstance(r[2], list) else json.loads(r[2] or '[]')
                fns.append({'name': r[0], 'code': r[1] or '', 'reads': reads})
        except Exception:
            pass
        return {'title': title or 'Site', 'description': description or '', 'html': html or '',
                'tables': tables, 'functions': fns}
    finally:
        conn.close()


# ────────────────────────────── извлечение частей сайта ──────────────────────────────
def split_site(html):
    """Чистим платформенный runtime и режем документ на CSS / <head>-ссылки / тело."""
    html = rw_markup.strip_injected_runtime(html or '')
    styles = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', html, re.IGNORECASE | re.DOTALL))
    head_m = re.search(r'<head[^>]*>(.*?)</head>', html, re.IGNORECASE | re.DOTALL)
    head = head_m.group(1) if head_m else ''
    # Из головы берём ТОЛЬКО шрифтовые <link> (charset/viewport/og Next задаёт через metadata сам).
    # <link> — void-тег: в JSX самозакрываем; crossorigin → crossOrigin (JSX-регистр атрибута).
    raw_links = re.findall(r'<link\b[^>]*?>', head, re.IGNORECASE)
    links = '\n    '.join(re.sub(r'\bcrossorigin\b', 'crossOrigin', re.sub(r'\s*/?>\s*$', ' />', l))
                          for l in raw_links)
    body_m = re.search(r'<body[^>]*>(.*?)</body>', html, re.IGNORECASE | re.DOTALL)
    body = body_m.group(1) if body_m else html
    # тело больше не должно тянуть <script> платформы (их уже нет) — но на всякий вырежем чужие inline-скрипты
    body = re.sub(r'<script\b[^>]*>.*?</script>', '', body, flags=re.IGNORECASE | re.DOTALL)
    return styles, links, body


def _ts_backtick_safe(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


# ────────────────────────────── генерация файлов проекта ──────────────────────────────
def build_files(proj):
    """Возвращает dict {относительный_путь: содержимое} готового Next.js+Prisma проекта."""
    styles, links, body = split_site(proj['html'])
    tables = proj['tables']
    fns = proj['functions']

    files = {}

    # package.json
    files['package.json'] = json.dumps({
        'name': re.sub(r'[^a-z0-9-]+', '-', (proj['title'] or 'site').lower()).strip('-') or 'roboweb-site',
        'version': '0.1.0', 'private': True,
        'scripts': {'dev': 'next dev', 'build': 'prisma generate && next build', 'start': 'next start',
                    'db:push': 'prisma db push'},
        'dependencies': {'next': '^15.1.0', 'react': '^19.0.0', 'react-dom': '^19.0.0',
                         '@prisma/client': '^6.0.0'},
        'devDependencies': {'prisma': '^6.0.0', 'typescript': '^5', '@types/node': '^22',
                            '@types/react': '^19'},
    }, indent=2, ensure_ascii=False)

    # eslint отключаем на сборке: в перенесённой разметке/коде модели неизбежны мелкие warning'и.
    files['next.config.mjs'] = ('const nextConfig = { eslint: { ignoreDuringBuilds: true } };\n'
                                'export default nextConfig;\n')
    # strict:false осознанно — перенесённый JS серверных функций не типизирован (implicit any); каркас
    # для разработчика, который ужесточит типы сам. Иначе next build падает на ported-коде.
    files['tsconfig.json'] = json.dumps({
        'compilerOptions': {'target': 'ES2020', 'lib': ['dom', 'dom.iterable', 'esnext'], 'allowJs': True,
                            'strict': False, 'noEmit': True, 'esModuleInterop': True, 'module': 'esnext',
                            'moduleResolution': 'bundler', 'jsx': 'preserve', 'incremental': True,
                            'plugins': [{'name': 'next'}], 'paths': {'@/*': ['./*']}},
        'include': ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], 'exclude': ['node_modules'],
    }, indent=2)
    files['.env.example'] = 'DATABASE_URL="postgresql://user:pass@localhost:5432/mydb?schema=public"\n'
    files['.gitignore'] = 'node_modules\n.next\n.env\n'

    # ── Prisma схема ──
    models = []
    perms = {}  # table -> {read, write, owner, model}
    for t in tables:
        model = _pascal(t['name'])
        perms[t['name']] = {'read': bool(t['public_read']), 'write': bool(t['public_write']),
                            'owner': bool(t['owner_scoped']), 'model': model}
        fields = ['  id        Int      @id @default(autoincrement())']
        if t['owner_scoped']:
            fields.append('  ownerId   String?  @map("owner_id")')
        # зарезервированные имена (совпали бы со служебными полями/колонками → коллизия @map в Prisma)
        RESERVED = {'id', 'ownerid', 'owner_id', 'createdat', 'created_at'}
        seen_cols = set()
        for c in (t['columns'] or []):
            fn = c.get('name') if isinstance(c, dict) else str(c)
            if fn and re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', fn) and fn.lower() not in RESERVED and fn.lower() not in seen_cols:
                seen_cols.add(fn.lower())
                fields.append(f'  {fn:<9} String?')
        fields.append('  createdAt DateTime @default(now()) @map("created_at")')
        models.append(f'model {model} {{\n' + '\n'.join(fields) + f'\n\n  @@map("{t["name"]}")\n}}')
    files['prisma/schema.prisma'] = (
        'generator client {\n  provider = "prisma-client-js"\n}\n\n'
        'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n'
        + '\n\n'.join(models) + '\n'
    )

    files['lib/prisma.ts'] = (
        "import { PrismaClient } from '@prisma/client';\n"
        "const g = globalThis as unknown as { prisma?: PrismaClient };\n"
        "export const prisma = g.prisma ?? new PrismaClient();\n"
        "if (process.env.NODE_ENV !== 'production') g.prisma = prisma;\n"
    )

    # ── единый data-API: POST (insert для write/owner) + GET (list для read) ──
    perms_json = json.dumps(perms, ensure_ascii=False)
    files['app/api/data/[table]/route.ts'] = (
        "import { NextRequest, NextResponse } from 'next/server';\n"
        "import { prisma } from '@/lib/prisma';\n\n"
        f"const PERMS: Record<string, {{read:boolean; write:boolean; owner:boolean; model:string}}> = {perms_json};\n\n"
        "// PoC: owner_scoped-строки требуют аутентификации (Фаза 2 подключит site-auth). Пока ownerId берём из заголовка.\n"
        "export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {\n"
        "  const { table } = await params;\n"
        "  const p = PERMS[table];\n"
        "  if (!p || (!p.write && !p.owner)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });\n"
        "  const body = await req.json().catch(() => ({}));\n"
        "  const data: Record<string, unknown> = { ...body };\n"
        "  if (p.owner) data.ownerId = req.headers.get('x-rw-user') || null;\n"
        "  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n"
        "  const client: any = prisma;\n"
        "  const created = await client[p.model.charAt(0).toLowerCase() + p.model.slice(1)].create({ data });\n"
        "  return NextResponse.json({ ok: true, id: created.id });\n"
        "}\n\n"
        "export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string }> }) {\n"
        "  const { table } = await params;\n"
        "  const p = PERMS[table];\n"
        "  if (!p || !p.read) return NextResponse.json({ error: 'forbidden' }, { status: 403 });\n"
        "  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n"
        "  const client: any = prisma;\n"
        "  const rows = await client[p.model.charAt(0).toLowerCase() + p.model.slice(1)].findMany({ take: 100 });\n"
        "  return NextResponse.json({ rows });\n"
        "}\n"
    )

    # ── серверные функции RW_FN → /api/fn/<name> (тело-JS исполняется как есть; Node vs duktape семантика документирована) ──
    for f in fns:
        nm = re.sub(r'[^a-zA-Z0-9_]+', '_', f['name'])
        reads = json.dumps(f.get('reads') or [])
        body_js = f.get('code') or 'function handler(input){ return { result: null }; }'
        files[f'app/api/fn/{nm}/route.ts'] = (
            "import { NextRequest, NextResponse } from 'next/server';\n"
            "import { prisma } from '@/lib/prisma';\n\n"
            f"// Перенесено из серверной функции RoboWeb «{f['name']}». В платформе исполнялось в duktape-песочнице;\n"
            "// здесь — обычный Node. Контракт: handler(input) -> { result, writes? }; input.tables.<name> = строки reads-таблиц.\n"
            f"const READS: string[] = {reads};\n"
            f"{body_js}\n\n"
            "export async function POST(req: NextRequest) {\n"
            "  const args = await req.json().catch(() => ({}));\n"
            "  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n"
            "  const client: any = prisma;\n"
            "  const tables: Record<string, unknown[]> = {};\n"
            "  for (const t of READS) { try { tables[t] = await client[t].findMany({ take: 500 }); } catch { tables[t] = []; } }\n"
            "  // @ts-ignore handler объявлен выше в перенесённом коде функции\n"
            "  const out = handler({ args, tables, user: req.headers.get('x-rw-user') || null });\n"
            "  return NextResponse.json(out ?? { result: null });\n"
            "}\n"
        )

    # ── страница + макет + глобальный CSS + клиентский раннер форм/каталогов ──
    files['app/globals.css'] = styles + '\n'
    files['app/_site.ts'] = 'export const SITE_HTML = `' + _ts_backtick_safe(body) + '`;\n'
    files['app/layout.tsx'] = (
        "import './globals.css';\n"
        "import type { Metadata } from 'next';\n"
        "import Script from 'next/script';\n\n"
        f"export const metadata: Metadata = {{ title: {json.dumps(proj['title'])}, "
        f"description: {json.dumps(proj['description'])} }};\n\n"
        "export default function RootLayout({ children }: { children: React.ReactNode }) {\n"
        "  return (\n    <html lang=\"ru\">\n      <head>\n    " + (links or '') + "\n      </head>\n"
        "      <body>\n        {children}\n        <Script src=\"/rw-export.js\" strategy=\"afterInteractive\" />\n"
        "      </body>\n    </html>\n  );\n}\n"
    )
    files['app/page.tsx'] = (
        "import { SITE_HTML } from './_site';\n\n"
        "export default function Page() {\n"
        "  return <div dangerouslySetInnerHTML={{ __html: SITE_HTML }} />;\n"
        "}\n"
    )

    # клиентский раннер: тонкий аналог платформенного window.rw, но бьёт в /api экспортированного проекта
    files['public/rw-export.js'] = (
        "(function(){\n"
        "  // Формы data-rw-table -> POST /api/data/<table>\n"
        "  document.querySelectorAll('form[data-rw-table]').forEach(function(f){\n"
        "    f.addEventListener('submit', function(e){\n"
        "      e.preventDefault();\n"
        "      var t = f.getAttribute('data-rw-table');\n"
        "      var d = {}; new FormData(f).forEach(function(v,k){ d[k]=v; });\n"
        "      fetch('/api/data/'+t, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)})\n"
        "        .then(function(r){return r.json();})\n"
        "        .then(function(){ var m=f.getAttribute('data-rw-success'); if(m) alert(m); f.reset(); })\n"
        "        .catch(function(){ alert('Ошибка отправки'); });\n"
        "    });\n"
        "  });\n"
        "  // Каталоги data-rw-catalog -> GET /api/data/<table>, заполняем <template data-rw-item>\n"
        "  document.querySelectorAll('[data-rw-catalog]').forEach(function(box){\n"
        "    var t = box.getAttribute('data-rw-catalog');\n"
        "    var tpl = box.querySelector('template[data-rw-item]');\n"
        "    var host = box.querySelector('[data-rw-items]');\n"
        "    if(!tpl||!host) return;\n"
        "    fetch('/api/data/'+t).then(function(r){return r.json();}).then(function(res){\n"
        "      var rows = (res&&res.rows)||[]; if(!rows.length) return;\n"
        "      host.innerHTML='';\n"
        "      rows.forEach(function(row){\n"
        "        var node = tpl.content.cloneNode(true);\n"
        "        node.querySelectorAll('[data-rw-field]').forEach(function(el){\n"
        "          var k=el.getAttribute('data-rw-field'); var val=row[k]||'';\n"
        "          if(el.tagName==='IMG') el.src=val; else el.textContent=val;\n"
        "        });\n"
        "        host.appendChild(node);\n"
        "      });\n"
        "    }).catch(function(){});\n"
        "  });\n"
        "  // TODO Фаза 2: data-rw-auth (вход/регистрация -> /api/auth), data-rw-cabinet, корзина/checkout\n"
        "})();\n"
    )

    # README — честный объём
    files['README.md'] = (
        f"# {proj['title']} — экспорт из RoboWeb\n\n"
        "Настоящий переносимый проект **Next.js (App Router) + Prisma + PostgreSQL**, скомпилированный из сайта RoboWeb.\n\n"
        "## Запуск\n\n"
        "```bash\nnpm install\ncp .env.example .env    # пропишите DATABASE_URL к своему Postgres\nnpx prisma db push      # создаст таблицы\nnpm run dev             # http://localhost:3000\n```\n\n"
        "## Что работает\n\n"
        "- Лендинг рендерится 1-в-1 (`app/page.tsx`, стили в `app/globals.css`).\n"
        "- Формы (`data-rw-table`) сохраняют заявки в Postgres через Prisma (`app/api/data/[table]`).\n"
        "- Каталоги (`data-rw-catalog`) читаются с сервера.\n"
        "- Серверные функции перенесены в `app/api/fn/*`.\n\n"
        "## Что ТРЕБУЕТ доработки (осознанно не покрыто PoC)\n\n"
        "- Аккаунты/личный кабинет (`data-rw-auth`, `data-rw-cabinet`) — заглушены, нужен свой auth.\n"
        "- Корзина/оформление заказа — клиентская логика не перенесена.\n"
        "- Все поля БД — `String?` (в RoboWeb типы не хранятся); уточните типы и связи вручную.\n\n"
        "_Это стартовый каркас для разработчика, а не готовый к продакшену сайт._\n"
    )

    return files


def build_project(proj, out_dir):
    """Собирает проект и пишет его в out_dir (CLI-режим). Возвращает список путей."""
    files = build_files(proj)
    for rel, content in files.items():
        path = os.path.join(out_dir, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(content)
    return list(files.keys())


def build_zip(proj):
    """Собирает проект в zip В ПАМЯТИ (для эндпоинта экспорта). Возвращает (filename, bytes)."""
    import io
    import zipfile
    files = build_files(proj)
    root = re.sub(r'[^a-z0-9-]+', '-', (proj.get('title') or 'site').lower()).strip('-') or 'roboweb-site'
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for rel, content in files.items():
            zf.writestr(f'{root}/{rel}', content)
    return f'{root}.zip', buf.getvalue()


if __name__ == '__main__':
    pid = int(sys.argv[1]) if len(sys.argv) > 1 else 11
    out = sys.argv[2] if len(sys.argv) > 2 else './export-out'
    project = load_project(pid)
    files = build_project(project, out)
    print(f'проект {pid} "{project["title"]}" -> {out}')
    print(f'таблиц: {len(project["tables"])}, функций: {len(project["functions"])}, файлов: {len(files)}')
    for f in sorted(files):
        print('  ', f)
