import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { type Lang } from '@/lib/i18n';

/** «Командный центр» — hero-визуал: парящие модули работающего продукта
 *  (заявка→БД, дашборд продаж, каталог, экспорт кода, онлайн). Тёмное премиум-«стекло»
 *  на любой теме страницы. Анимации .mc-* в index.css (+ prefers-reduced-motion). */
const BASE_W = 600;
const BASE_H = 556;

export function MissionControlHero({ lang }: { lang: Lang }) {
  const ru = lang === 'ru';
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / BASE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Небольшая ре-калибровка после монтирования (шрифты/лейаут)
  useEffect(() => { const t = setTimeout(() => { const el = wrapRef.current; if (el) setScale(Math.min(1, el.clientWidth / BASE_W)); }, 60); return () => clearTimeout(t); }, []);

  const card = 'rgba(19,25,39,0.72)';
  const cardBorder = '1px solid rgba(255,255,255,0.09)';
  const ink = '#eaf0fb', dim = '#93a2bf', dim2 = '#6b7a99', blue = '#6366f1', green = '#3ddc84';
  const mono = "ui-monospace,'SF Mono',Menlo,monospace";
  const cardShadow = '0 24px 50px -20px rgba(4,8,18,0.85)';

  const bars = [42, 55, 48, 68, 60, 90, 78, 96];

  return (
    <div ref={wrapRef} className="relative w-full max-w-[600px] mx-auto lg:max-w-none"
      style={{ height: BASE_H * scale }}>
      <div className="mc-sheet"
        style={{ position: 'absolute', top: 0, left: '50%', width: BASE_W, height: BASE_H, transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center' }}>

        {/* ── ГЛАВНЫЙ ДАШБОРД (якорь) ── */}
        <div className="mc-in" style={{ position: 'absolute', left: 150, top: 100, width: 442, animationDelay: '.15s' }}>
          <div style={{ position: 'relative', borderRadius: 16, background: 'rgba(16,21,34,0.94)', border: cardBorder, boxShadow: '0 30px 70px -24px rgba(4,8,18,0.9)', overflow: 'hidden' }}>
            <div className="mc-shine" />
            {/* браузер-бар */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 9, background: '#ff5f57' }} />
              <span style={{ width: 8, height: 8, borderRadius: 9, background: '#febc2e' }} />
              <span style={{ width: 8, height: 8, borderRadius: 9, background: '#28c840' }} />
              <span style={{ marginLeft: 8, fontSize: 11, color: dim2, fontFamily: mono }}>shop.roboweb.dev</span>
            </div>
            <div style={{ display: 'flex' }}>
              {/* сайдбар (его перекрывает форма — это ок) */}
              <div style={{ width: 96, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '13px 11px' }}>
                {[
                  { i: 'grid', t: ru ? 'Обзор' : 'Overview', on: true },
                  { i: 'bag', t: ru ? 'Заказы' : 'Orders' },
                  { i: 'box', t: ru ? 'Каталог' : 'Catalog' },
                  { i: 'user', t: ru ? 'Клиенты' : 'Clients' },
                  { i: 'key', t: ru ? 'Кабинеты' : 'Accounts' },
                ].map(n => (
                  <div key={n.t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 7px', marginBottom: 3, borderRadius: 8, background: n.on ? 'rgba(99,102,241,.16)' : 'transparent' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 5, background: n.on ? blue : '#3b475f' }} />
                    <span style={{ fontSize: 11, fontWeight: n.on ? 700 : 500, color: n.on ? '#cfe0ff' : dim2 }}>{n.t}</span>
                  </div>
                ))}
              </div>
              {/* основная область */}
              <div style={{ flex: 1, padding: '13px 15px 15px', minWidth: 0 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: ink }}>{ru ? 'Обзор продаж' : 'Sales overview'}</div>
                  <div style={{ fontSize: 10.5, color: dim2, marginTop: 2 }}>{ru ? 'Данные из вашей PostgreSQL' : 'Data from your PostgreSQL'}</div>
                </div>
                {/* KPI */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
                  {[
                    { l: ru ? 'Выручка' : 'Revenue', v: '₽ 1,84М', d: '+12,4%' },
                    { l: ru ? 'Заказы' : 'Orders', v: '642', d: '+8,1%' },
                    { l: ru ? 'Конверсия' : 'Conv.', v: '4,7%', d: '+0,6%' },
                  ].map(k => (
                    <div key={k.l} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 9px' }}>
                      <div style={{ fontSize: 9.5, color: dim2 }}>{k.l}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: ink, marginTop: 2, letterSpacing: '-.3px' }}>{k.v}</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: green, marginTop: 2 }}>▲ {k.d}</div>
                    </div>
                  ))}
                </div>
                {/* график */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>{ru ? 'Выручка по неделям' : 'Revenue by week'}</div>
                  <div style={{ fontSize: 9.5, color: dim2 }}>{ru ? 'последние 8 недель' : 'last 8 weeks'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 66, marginTop: 10 }}>
                  {bars.map((h, i) => (
                    <div key={i} className="mc-bar" style={{ flex: 1, height: `${h}%`, borderRadius: 5, animationDelay: `${0.5 + i * 0.08}s`,
                      background: i === bars.length - 1 ? `linear-gradient(180deg,#818cf8,${blue})` : 'linear-gradient(180deg,rgba(99,102,241,.55),rgba(99,102,241,.2))' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ФОРМА → БАЗА ДАННЫХ ── */}
        <div className="mc-in" style={{ position: 'absolute', left: 2, top: 54, width: 244, animationDelay: '.35s' }}>
          <div className="mc-float" style={{ position: 'relative', borderRadius: 15, background: 'rgba(17,22,36,0.9)', border: cardBorder, boxShadow: cardShadow, backdropFilter: 'blur(12px)', padding: 14 }}>
            <span className="mc-ok" style={{ position: 'absolute', top: -9, right: -9, width: 26, height: 26, borderRadius: 13, background: green, display: 'grid', placeItems: 'center', border: '2px solid #0b0f17' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#06210f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,.16)', border: '1px solid rgba(99,102,241,.32)', display: 'grid', placeItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v12H4z" stroke="#9fbcff" strokeWidth="1.7" /><path d="M8 9h8M8 13h5" stroke="#9fbcff" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: ink }}>{ru ? 'Новая заявка' : 'New lead'}</div>
                <div style={{ fontSize: 10.5, color: dim2 }}>{ru ? 'форма → база данных' : 'form → database'}</div>
              </div>
            </div>
            {[
              { l: ru ? 'Имя' : 'Name', v: ru ? 'Анна Соколова' : 'Anna Sokolova' },
              { l: ru ? 'Телефон' : 'Phone', v: '+7 921 044-19-30' },
            ].map(f => (
              <div key={f.l} style={{ marginTop: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '7px 11px' }}>
                <div style={{ fontSize: 9.5, color: dim2 }}>{f.l}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: ink, marginTop: 1 }}>{f.v}</div>
              </div>
            ))}
            <div style={{ marginTop: 11, height: 34, borderRadius: 10, background: `linear-gradient(135deg,#6366f1,${blue})`, display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
              {ru ? 'Записано в БД ✓' : 'Saved to DB ✓'}
            </div>
          </div>
        </div>

        {/* ── ЭКСПОРТ КОДА ── */}
        <div className="mc-in" style={{ position: 'absolute', left: 406, top: 2, width: 190, animationDelay: '.55s' }}>
          <div className="mc-float2" style={{ borderRadius: 14, background: card, border: cardBorder, boxShadow: cardShadow, backdropFilter: 'blur(10px)', padding: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke="#9fbcff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: ink }}>{ru ? 'Экспорт кода' : 'Code export'}</div>
                <div style={{ fontSize: 10, color: dim2 }}>Next.js + Prisma</div>
              </div>
            </div>
            <div style={{ marginTop: 10, borderRadius: 9, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.06)', padding: '9px 11px', fontFamily: mono, fontSize: 10.5, lineHeight: 1.55 }}>
              <div><span style={{ color: '#c792ea' }}>model</span> <span style={{ color: '#82aaff' }}>Order</span> <span style={{ color: dim }}>{'{'}</span></div>
              <div style={{ color: dim }}>&nbsp;&nbsp;id&nbsp;&nbsp;&nbsp;<span style={{ color: '#7fdbca' }}>Int</span></div>
              <div style={{ color: dim }}>&nbsp;&nbsp;total <span style={{ color: '#7fdbca' }}>Decimal</span></div>
              <div style={{ color: dim }}>&nbsp;&nbsp;items <span style={{ color: '#7fdbca' }}>Item[]</span></div>
              <div style={{ color: dim }}>{'}'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: ink }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#e9eefb"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.9 9.5.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.3-1.1.6-1.4-2.3-.3-4.7-1.1-4.7-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .3.3.7 1 .7 1.9v2.8c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10Z" /></svg>
                GitHub
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: ink }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" fill="#4f46e5" /><path d="M8 8h5.5a3 3 0 0 1 0 6H10v2M10 11h3" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                GitFlic
              </span>
            </div>
          </div>
        </div>

        {/* ── КАТАЛОГ · КОРЗИНА ── */}
        <div className="mc-in" style={{ position: 'absolute', left: 22, top: 372, width: 288, animationDelay: '.75s' }}>
          <div className="mc-float2" style={{ borderRadius: 15, background: card, border: cardBorder, boxShadow: cardShadow, backdropFilter: 'blur(10px)', padding: 13 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.6px', color: dim2 }}>{ru ? 'КАТАЛОГ · КОРЗИНА' : 'CATALOG · CART'}</div>
            {[
              { c: 'linear-gradient(135deg,#6d8bff,#6366f1)', n: ru ? 'Кресло Aero' : 'Aero Chair', s: ru ? 'на складе · 24' : 'in stock · 24', p: '18 900 ₽' },
              { c: 'linear-gradient(135deg,#38d3e0,#2f9bff)', n: ru ? 'Лампа Nord' : 'Nord Lamp', s: ru ? 'на складе · 61' : 'in stock · 61', p: '4 500 ₽' },
              { c: 'linear-gradient(135deg,#a78bfa,#7c5cf5)', n: ru ? 'Стол Linea' : 'Linea Table', s: ru ? 'под заказ' : 'on order', p: '32 400 ₽' },
            ].map(r => (
              <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: r.c, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ink }}>{r.n}</div>
                  <div style={{ fontSize: 10, color: dim2 }}>{r.s}</div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: ink }}>{r.p}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ОНЛАЙН СЕЙЧАС ── */}
        <div className="mc-in" style={{ position: 'absolute', left: 386, top: 380, width: 210, animationDelay: '.95s' }}>
          <div className="mc-float" style={{ borderRadius: 15, background: card, border: cardBorder, boxShadow: cardShadow, backdropFilter: 'blur(10px)', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ink, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="mc-live" style={{ width: 7, height: 7, borderRadius: 5, background: green }} />
                {ru ? 'Онлайн сейчас' : 'Online now'}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: green }}>▲ 18%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: ink, letterSpacing: '-.5px' }}>328</span>
              <span style={{ fontSize: 11.5, color: dim2 }}>{ru ? 'посетителей' : 'visitors'}</span>
            </div>
            <svg viewBox="0 0 176 44" style={{ width: '100%', height: 40, marginTop: 6 }} fill="none">
              <defs>
                <linearGradient id="mcSpark" x1="0" y1="0" x2="0" y2="1"><stop stopColor={blue} stopOpacity=".35" /><stop offset="1" stopColor={blue} stopOpacity="0" /></linearGradient>
              </defs>
              <path d="M2 34 L24 30 L46 33 L68 22 L90 25 L112 14 L134 18 L162 6 L174 8 V44 H2 Z" fill="url(#mcSpark)" />
              <path d="M2 34 L24 30 L46 33 L68 22 L90 25 L112 14 L134 18 L162 6 L174 8" stroke={blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="174" cy="8" r="3.4" fill="#fff" />
            </svg>
          </div>
        </div>

      </div>

      {/* Подпись под визуалом */}
      <p className="mt-3 text-center text-xs text-muted-foreground inline-flex w-full items-center justify-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: blue }} />
        {ru ? 'Рабочий продукт с бэкендом — собирается на глазах, код остаётся у вас' : 'A working product with a backend — assembled live, the code stays yours'}
      </p>
    </div>
  );
}
