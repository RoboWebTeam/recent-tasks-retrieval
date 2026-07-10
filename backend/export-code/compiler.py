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


# ══════════════ Фаза 2: аккаунты + сессии + кабинет + корзина (шаблоны файлов) ══════════════
# Портировано из site-auth/public-data/public-fn в standalone Next.js. Один сайт = одна БД,
# поэтому project_id/X-RW-Token платформы отброшены; owner_id ставит ТОЛЬКО сервер по сессии.

AUTH_MODELS = '''

model SiteUser {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  sessions     SiteSession[]

  @@map("site_users")
}

model SiteSession {
  token     String   @id
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  user      SiteUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("site_sessions")
}

model RateLimit {
  id        Int      @id @default(autoincrement())
  key       String
  createdAt DateTime @default(now()) @map("created_at")

  @@index([key, createdAt])
  @@map("rate_limits")
}
'''

SESSION_TS = '''import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'rw_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

// Единственный источник owner-идентичности: cookie rw_session -> SiteUser.
export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.siteSession.findUnique({ where: { token }, include: { user: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return { id: s.user.id, email: s.user.email, name: s.user.name };
}
export function sessionMaxAge() { return MAX_AGE; }
'''

AUTH_TS = '''import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// DUMMY_HASH считается один раз — для constant-time логина, когда пользователя нет.
export const DUMMY_HASH = bcrypt.hashSync('x', 12);
export const hashPw = (pw: string) => bcrypt.hash(pw, 12);
export const checkPw = (pw: string, h: string) => bcrypt.compare(pw, h || DUMMY_HASH).catch(() => false);
export const newToken = () => randomBytes(32).toString('base64url');

export function cookieOpts(expires: Date) {
  return { httpOnly: true, sameSite: 'lax' as const, path: '/',
           secure: process.env.NODE_ENV === 'production', expires };
}
'''

RATELIMIT_TS = '''import { prisma } from '@/lib/prisma';

// fail-closed: при ошибке БД считаем, что лимит превышен.
export async function rateLimit(key: string, limit: number, windowMin: number) {
  try {
    await prisma.rateLimit.deleteMany({ where: { key, createdAt: { lt: new Date(Date.now() - windowMin * 60000) } } });
    const n = await prisma.rateLimit.count({ where: { key } });
    if (n >= limit) return true;
    await prisma.rateLimit.create({ data: { key } });
    return false;
  } catch { return true; }
}
'''

REGISTER_TS = '''import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPw, newToken, cookieOpts } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import { SESSION_COOKIE, sessionMaxAge } from '@/lib/session';

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = (b.email || '').trim().toLowerCase();
  const password = b.password || '';
  const name = (b.name || '').trim().replace(/[<>]/g, '').slice(0, 100) || null;
  if (!email || !email.includes('@') || email.length > 254)
    return NextResponse.json({ error: 'Укажите корректный e-mail' }, { status: 400 });
  if (password.length < 8 || password.length > 128)
    return NextResponse.json({ error: 'Пароль: от 8 до 128 символов' }, { status: 400 });
  const ip = (req.headers.get('x-forwarded-for') || '').split(',').pop()?.trim() || 'unknown';
  if (await rateLimit('sreg:' + ip, 10, 60))
    return NextResponse.json({ error: 'Слишком много регистраций, попробуйте позже' }, { status: 429 });
  let user;
  try { user = await prisma.siteUser.create({ data: { email, name, passwordHash: await hashPw(password) } }); }
  catch { return NextResponse.json({ error: 'Не удалось зарегистрировать — возможно, e-mail уже используется' }, { status: 400 }); }
  const token = newToken();
  const expires = new Date(Date.now() + sessionMaxAge() * 1000);
  await prisma.siteSession.create({ data: { token, userId: user.id, expiresAt: expires } });
  const res = NextResponse.json({ ok: true, user: { email, name } });
  res.cookies.set(SESSION_COOKIE, token, cookieOpts(expires));
  return res;
}
'''

LOGIN_TS = '''import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPw, DUMMY_HASH, newToken, cookieOpts } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import { SESSION_COOKIE, sessionMaxAge } from '@/lib/session';

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = (b.email || '').trim().toLowerCase();
  const password = b.password || '';
  if (!email || !password) return NextResponse.json({ error: 'Введите e-mail и пароль' }, { status: 400 });
  const ip = (req.headers.get('x-forwarded-for') || '').split(',').pop()?.trim() || 'unknown';
  if (await rateLimit('slog:' + ip, 8, 15))
    return NextResponse.json({ error: 'Слишком много попыток входа, попробуйте позже' }, { status: 429 });
  const row = await prisma.siteUser.findUnique({ where: { email } });
  const ok = await checkPw(password, row ? row.passwordHash : DUMMY_HASH); // compare ВСЕГДА
  if (!ok || !row) return NextResponse.json({ error: 'Неверный e-mail или пароль' }, { status: 401 });
  const token = newToken();
  const expires = new Date(Date.now() + sessionMaxAge() * 1000);
  await prisma.siteSession.create({ data: { token, userId: row.id, expiresAt: expires } });
  const res = NextResponse.json({ ok: true, user: { email: row.email, name: row.name } });
  res.cookies.set(SESSION_COOKIE, token, cookieOpts(expires));
  return res;
}
'''

LOGOUT_TS = '''import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE } from '@/lib/session';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await prisma.siteSession.deleteMany({ where: { token } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
'''

ME_TS = '''import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  const user = await getSessionUser();
  return user ? NextResponse.json({ user }) : NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
}
'''

# data-API с сессионным owner-scoping (закрывает IDOR: owner_id из сессии, а не из заголовка).
DATA_ROUTE_TS = '''import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

const PERMS: Record<string, {read:boolean; write:boolean; owner:boolean; model:string}> = /*PERMS*/;
const BLACKLIST = new Set(['__proto__','constructor','prototype','ownerId','owner_id','owner',
  'userId','user_id','id','createdAt','created_at']);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client: any = prisma;
const acc = (model: string) => model.charAt(0).toLowerCase() + model.slice(1);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params; const p = PERMS[table];
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (p.owner) {
    const u = await getSessionUser();
    if (!u) return NextResponse.json({ error: 'auth required' }, { status: 401 });
    const rows = await client[acc(p.model)].findMany({ where: { ownerId: u.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ rows });
  }
  if (!p.read) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const rows = await client[acc(p.model)].findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params; const p = PERMS[table];
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  let ownerId: string | null = null;
  if (p.owner) {
    const u = await getSessionUser();
    if (!u) return NextResponse.json({ error: 'auth required' }, { status: 401 });
    ownerId = u.id;
  } else if (!p.write) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) if (!BLACKLIST.has(k)) data[k] = v;
  if (ownerId) data.ownerId = ownerId; // ставит ТОЛЬКО сервер
  const created = await client[acc(p.model)].create({ data });
  return NextResponse.json({ ok: true, id: created.id });
}
'''

# checkout: сумму считает СЕРВЕР по ценам каталога; заказ owner-scoped. Плейсхолдеры подставит компилятор.
CHECKOUT_TS = '''import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'auth required' }, { status: 401 });
  const { items } = await req.json().catch(() => ({ items: [] }));
  if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: 'корзина пуста' }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = prisma;
  const products = await client.__CATALOG__.findMany({ take: 500 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byId: Map<string, any> = new Map(products.map((p: any) => [String(p.id), p]));
  let total = 0; const lines: string[] = [];
  for (const it of items) {
    const p: any = byId.get(String(it.productId)); if (!p) continue;
    const qty = Math.max(1, Math.min(99, parseInt(it.qty) || 1));
    const price = parseFloat(p.__PRICE__) || 0;   // цена ТОЛЬКО из БД (клиентскую игнорируем)
    total += price * qty; lines.push((p.__TITLE__ || ('#' + p.id)) + ' x' + qty);
  }
  if (!lines.length) return NextResponse.json({ error: 'нет валидных позиций (наполните каталог в БД)' }, { status: 400 });
  const order = await client.__ORDER__.create({ data: { ownerId: user.id__ORDER_EXTRA__ } });
  return NextResponse.json({ ok: true, orderId: order.id, total });
}
'''

# Клиентский раннер экспорта: формы + каталоги + аккаунты + кабинет + корзина + checkout. Same-origin cookie.
CLIENT_JS = '''(function(){
  if (window.rw && window.rw.__export) return;
  // ── Формы data-rw-table -> POST /api/data/<table> ──
  document.querySelectorAll('form[data-rw-table]').forEach(function(f){
    f.addEventListener('submit', function(e){ e.preventDefault();
      var t=f.getAttribute('data-rw-table'); var d={}; new FormData(f).forEach(function(v,k){ d[k]=v; });
      fetch('/api/data/'+t,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
        .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,j:j}; }); })
        .then(function(x){ if(!x.ok){ alert((x.j&&x.j.error)||'Ошибка отправки'); return; } var m=f.getAttribute('data-rw-success'); if(m) alert(m); f.reset(); })
        .catch(function(){ alert('Ошибка сети'); });
    });
  });
  // ── Каталоги data-rw-catalog -> GET /api/data/<table> ──
  document.querySelectorAll('[data-rw-catalog]').forEach(function(box){
    var t=box.getAttribute('data-rw-catalog'); var tpl=box.querySelector('template[data-rw-item]'); var host=box.querySelector('[data-rw-items]');
    if(!tpl||!host) return;
    fetch('/api/data/'+t,{credentials:'same-origin'}).then(function(r){ return r.json(); }).then(function(res){
      var rows=(res&&res.rows)||[]; if(!rows.length) return; host.innerHTML='';
      rows.forEach(function(row){ var node=tpl.content.cloneNode(true);
        node.querySelectorAll('[data-rw-field]').forEach(function(el){ var k=el.getAttribute('data-rw-field'); var val=row[k]||'';
          if(el.tagName==='IMG') el.src=val; else el.textContent=val; });
        host.appendChild(node); });
    }).catch(function(){});
  });
  // ── Аккаунты: состояние входа (data-rw-when in/out, data-rw-user) ──
  function applyAuth(user){
    document.querySelectorAll('[data-rw-when]').forEach(function(el){
      var show=(el.getAttribute('data-rw-when')==='in')?!!user:!user; el.style.display=show?'':'none'; });
    if(user) document.querySelectorAll('[data-rw-user]').forEach(function(el){
      var k=el.getAttribute('data-rw-user')||'name'; el.textContent=user[k]||user.name||user.email||''; });
  }
  function refreshAuth(){ return fetch('/api/auth/me',{credentials:'same-origin'})
    .then(function(r){ return r.ok?r.json():{user:null}; })
    .then(function(res){ applyAuth(res.user||null); loadCabinets(res.user||null); })
    .catch(function(){ applyAuth(null); }); }
  document.querySelectorAll('form[data-rw-auth]').forEach(function(f){
    f.addEventListener('submit', function(e){ e.preventDefault();
      var mode=f.getAttribute('data-rw-auth'); var d={}; new FormData(f).forEach(function(v,k){ d[k]=v; });
      fetch('/api/auth/'+mode,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
        .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,j:j}; }); })
        .then(function(x){ if(!x.ok){ alert((x.j&&x.j.error)||'Ошибка'); return; } f.reset(); return refreshAuth(); })
        .catch(function(){ alert('Ошибка сети'); });
    });
  });
  document.querySelectorAll('[data-rw-logout]').forEach(function(el){
    el.addEventListener('click', function(e){ e.preventDefault();
      fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).then(refreshAuth); }); });
  // ── Личный кабинет: data-rw-cabinet -> GET /api/data/<table> (owner-scoped) ──
  function loadCabinets(user){
    document.querySelectorAll('[data-rw-cabinet]').forEach(function(box){
      var t=box.getAttribute('data-rw-cabinet'); var tpl=box.querySelector('template[data-rw-item]'); var host=box.querySelector('[data-rw-items]')||box;
      var empty=box.querySelector('[data-rw-empty]');
      if(!user){ if(empty) empty.style.display=''; return; }
      fetch('/api/data/'+t,{credentials:'same-origin'}).then(function(r){ return r.ok?r.json():{rows:[]}; }).then(function(res){
        var rows=(res&&res.rows)||[]; if(empty) empty.style.display=rows.length?'none':'';
        if(!tpl) return; host.querySelectorAll('[data-rw-row]').forEach(function(x){ x.remove(); });
        rows.forEach(function(row){ var node=tpl.content.cloneNode(true); var root=node.firstElementChild; if(root) root.setAttribute('data-rw-row','');
          node.querySelectorAll('[data-rw-field]').forEach(function(el){ var k=el.getAttribute('data-rw-field'); el.textContent=(row[k]==null?'':row[k]); });
          host.appendChild(node); });
      }).catch(function(){});
    });
  }
  // ── Корзина (localStorage) ──
  var STK='rw_store';
  function loadStore(){ try{ var s=JSON.parse(localStorage.getItem(STK)); return (s&&s.cart)?s:{cart:[]}; }catch(e){ return {cart:[]}; } }
  function saveStore(){ try{ localStorage.setItem(STK,JSON.stringify({cart:window.rw.store.cart})); }catch(e){} }
  function cCount(){ return window.rw.store.cart.reduce(function(n,i){ return n+(i.qty||1); },0); }
  function cTotal(){ return window.rw.store.cart.reduce(function(s,i){ return s+(+i.price||0)*(i.qty||1); },0); }
  function renderCart(){
    document.querySelectorAll('[data-rw-bind]').forEach(function(el){ var k=el.getAttribute('data-rw-bind');
      if(k==='cart.count') el.textContent=cCount(); else if(k==='cart.total') el.textContent=cTotal(); });
    document.querySelectorAll('[data-rw-cart]').forEach(function(box){ var tpl=box.querySelector('template[data-rw-cart-item]'); if(!tpl) return;
      var host=box.querySelector('[data-rw-items]')||box; host.querySelectorAll('[data-rw-row]').forEach(function(x){ x.remove(); });
      window.rw.store.cart.forEach(function(it,idx){ var n=tpl.content.cloneNode(true); var root=n.firstElementChild; if(root) root.setAttribute('data-rw-row','');
        n.querySelectorAll('[data-rw-field]').forEach(function(el){ var fld=el.getAttribute('data-rw-field'); el.textContent=(it[fld]==null?'':it[fld]); });
        n.querySelectorAll('[data-rw-cart-remove]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); window.rw.store.cart.splice(idx,1); saveStore(); renderCart(); }); });
        host.appendChild(n); }); });
  }
  window.rw={store:loadStore()}; if(!Array.isArray(window.rw.store.cart)) window.rw.store.cart=[];
  window.rw.cart={
    add:function(it){ var ex=window.rw.store.cart.filter(function(x){ return String(x.id)===String(it.id); })[0];
      if(ex) ex.qty=(ex.qty||1)+1; else window.rw.store.cart.push({id:it.id,productId:it.id,item:it.item,price:+it.price||0,qty:1});
      saveStore(); renderCart(); },
    clear:function(){ window.rw.store.cart=[]; saveStore(); renderCart(); }
  };
  document.querySelectorAll('[data-rw-add-to-cart]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault();
    window.rw.cart.add({id:b.getAttribute('data-id')||b.getAttribute('data-item'),item:b.getAttribute('data-item'),price:b.getAttribute('data-price')}); }); });
  document.querySelectorAll('[data-rw-cart-clear]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); window.rw.cart.clear(); }); });
  document.querySelectorAll('[data-rw-checkout]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault();
    if(!window.rw.store.cart.length){ alert('Корзина пуста'); return; }
    var items=window.rw.store.cart.map(function(c){ return {productId:c.productId||c.id, qty:c.qty||1}; });
    fetch('/api/fn/checkout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items})})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,j:j}; }); })
      .then(function(x){ if(x.ok){ window.rw.cart.clear(); alert(b.getAttribute('data-rw-success')||('Заказ оформлен на сумму '+x.j.total)); refreshAuth(); }
        else if(x.j&&x.j.error==='auth required'){ alert('Войдите, чтобы оформить заказ'); }
        else alert((x.j&&x.j.error)||'Ошибка оформления'); })
      .catch(function(){ alert('Ошибка сети'); }); }); });
  window.rw.__export=true; renderCart(); refreshAuth();
})();
'''


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
                         '@prisma/client': '^6.0.0', 'bcryptjs': '^2.4.3'},
        'devDependencies': {'prisma': '^6.0.0', 'typescript': '^5', '@types/node': '^22',
                            '@types/react': '^19', '@types/bcryptjs': '^2.4.6'},
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
        # owner-таблицам нужен индекс по ownerId (findMany where ownerId — иначе seq scan)
        suffix = '\n\n  @@index([ownerId])' if t['owner_scoped'] else ''
        models.append(f'model {model} {{\n' + '\n'.join(fields) + f'{suffix}\n\n  @@map("{t["name"]}")\n}}')
    files['prisma/schema.prisma'] = (
        'generator client {\n  provider = "prisma-client-js"\n}\n\n'
        'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n'
        + '\n\n'.join(models) + '\n'
        + AUTH_MODELS  # системные модели аккаунтов/сессий/rate-limit (Фаза 2)
    )

    files['lib/prisma.ts'] = (
        "import { PrismaClient } from '@prisma/client';\n"
        "const g = globalThis as unknown as { prisma?: PrismaClient };\n"
        "export const prisma = g.prisma ?? new PrismaClient();\n"
        "if (process.env.NODE_ENV !== 'production') g.prisma = prisma;\n"
    )

    # ── Аккаунты посетителей (Фаза 2): сессия + bcrypt + rate-limit + роуты /api/auth/* ──
    files['lib/session.ts'] = SESSION_TS
    files['lib/auth.ts'] = AUTH_TS
    files['lib/ratelimit.ts'] = RATELIMIT_TS
    files['app/api/auth/register/route.ts'] = REGISTER_TS
    files['app/api/auth/login/route.ts'] = LOGIN_TS
    files['app/api/auth/logout/route.ts'] = LOGOUT_TS
    files['app/api/auth/me/route.ts'] = ME_TS

    # ── data-API с сессионным owner-scoping (GET владельца — только свои строки; owner_id ставит сервер) ──
    perms_json = json.dumps(perms, ensure_ascii=False)
    files['app/api/data/[table]/route.ts'] = DATA_ROUTE_TS.replace('/*PERMS*/', perms_json)

    # ── checkout (Фаза 2): эмитим только если есть публичный каталог с ценой И owner-таблица заказов ──
    def _col_names(t):
        return [(c.get('name') if isinstance(c, dict) else str(c)) or '' for c in (t.get('columns') or [])]
    catalog_t = next((t for t in tables if t.get('public_read') and any(
        (c or '').lower() in ('price', 'cost', 'amount', 'стоимость', 'цена') for c in _col_names(t))), None)
    order_t = next((t for t in tables if t.get('owner_scoped')), None)
    if catalog_t and order_t:
        ccols = [c.lower() for c in _col_names(catalog_t)]
        price_col = next((c for c in ('price', 'cost', 'amount') if c in ccols), 'price')
        title_col = next((c for c in ('title', 'name', 'item', 'product') if c in ccols), 'title')
        ocols = [c.lower() for c in _col_names(order_t)]
        extra = ''
        tcol = next((c for c in ('total', 'sum', 'amount', 'price', 'cost') if c in ocols), None)
        if tcol:
            extra += f', {tcol}: String(total)'
        scol = next((c for c in ('items', 'summary', 'order', 'products', 'details', 'comment', 'note') if c in ocols), None)
        if scol:
            extra += f', {scol}: lines.join(\', \')'
        files['app/api/fn/checkout/route.ts'] = (CHECKOUT_TS
            .replace('__CATALOG__', _pascal(catalog_t['name'])[0].lower() + _pascal(catalog_t['name'])[1:])
            .replace('__ORDER__', _pascal(order_t['name'])[0].lower() + _pascal(order_t['name'])[1:])
            .replace('__PRICE__', price_col).replace('__TITLE__', title_col)
            .replace('__ORDER_EXTRA__', extra))

    # ── серверные функции RW_FN → /api/fn/<name> (тело-JS исполняется как есть; Node vs duktape семантика документирована) ──
    for f in fns:
        nm = re.sub(r'[^a-zA-Z0-9_]+', '_', f['name'])
        if f'app/api/fn/{nm}/route.ts' in files:
            continue  # спец-шаблон (напр. безопасный checkout) уже занял путь — не перезаписываем ported-версией
        reads = json.dumps(f.get('reads') or [])
        body_js = f.get('code') or 'function handler(input){ return { result: null }; }'
        files[f'app/api/fn/{nm}/route.ts'] = (
            "import { NextRequest, NextResponse } from 'next/server';\n"
            "import { prisma } from '@/lib/prisma';\n"
            "import { getSessionUser } from '@/lib/session';\n\n"
            f"// Перенесено из серверной функции RoboWeb «{f['name']}». В платформе исполнялось в duktape-песочнице;\n"
            "// здесь — обычный Node. Контракт: handler(input) -> { result, writes? }; input.tables.<name> = строки reads-таблиц.\n"
            f"const READS: string[] = {reads};\n"
            f"{body_js}\n\n"
            "export async function POST(req: NextRequest) {\n"
            "  const args = await req.json().catch(() => ({}));\n"
            "  const u = await getSessionUser();  // user из сессии, а не из спуфабельного заголовка\n"
            "  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n"
            "  const client: any = prisma;\n"
            "  const tables: Record<string, unknown[]> = {};\n"
            "  for (const t of READS) { try { tables[t] = await client[t].findMany({ take: 500 }); } catch { tables[t] = []; } }\n"
            "  // @ts-ignore handler объявлен выше в перенесённом коде функции\n"
            "  const out = handler({ args, tables, user: u ? u.id : null });\n"
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

    # клиентский раннер: формы + каталоги + аккаунты + кабинет + корзина + checkout (Фаза 2)
    files['public/rw-export.js'] = CLIENT_JS

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
        "- **Аккаунты** (`data-rw-auth=\"login|register\"`, `data-rw-logout`, `data-rw-when`, `data-rw-user`) — "
        "регистрация/вход через `/api/auth/*` (bcrypt, httpOnly-cookie сессия).\n"
        "- **Личный кабинет** (`data-rw-cabinet`) — показывает ТОЛЬКО строки вошедшего (owner-scoped).\n"
        "- **Корзина** (`data-rw-add-to-cart`, `data-rw-bind`, `data-rw-cart`) — localStorage; оформление "
        "(`data-rw-checkout`) считает сумму НА СЕРВЕРЕ по ценам каталога.\n"
        "- Серверные функции перенесены в `app/api/fn/*`.\n\n"
        "## Ограничения (важно перед продакшеном)\n\n"
        "- Все поля БД — `String?` (в RoboWeb типы не хранятся); уточните типы/связи; цена приводится `parseFloat`.\n"
        "- Оформление заказа работает, если таблица-каталог наполнена товарами, чьи `id` совпадают с `data-id` кнопок.\n"
        "- Безопасность из коробки НЕ production-grade: нужен HTTPS, доверенный reverse-proxy для `x-forwarded-for`, "
        "периодическая чистка просроченных сессий (`DELETE FROM site_sessions WHERE expires_at < now()`).\n"
        "- Мультитенантность платформы (`project_id`) намеренно отброшена: один экспорт = одна БД.\n\n"
        "_Стартовый каркас для разработчика: функционально полный фулстек, но перед продом просмотрите безопасность и типы._\n"
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
