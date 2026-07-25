import { type Lang } from '@/lib/i18n';

/** «Живой инженерный чертёж» — hero-визуал: технический blueprint, который рисует сам себя.
 *  Промпт → ядро ИИ → узлы (Экран/API/База/Auth) → выгрузка в GitHub. Штрих-прорисовка линий,
 *  всплытие узлов, сканирующий луч, аннотации «от руки». Чистый SVG + CSS (см. .bp-* в index.css). */
export function BlueprintHero({ lang }: { lang: Lang }) {
  const ru = lang === 'ru';
  // Узлы фуллстека
  const nodes = [
    { x: 8,   label: ru ? 'Экран' : 'Screen',  glyph: 'screen' },
    { x: 118, label: 'API',                      glyph: 'api' },
    { x: 228, label: ru ? 'База' : 'Database',  glyph: 'db' },
    { x: 338, label: 'Auth',                     glyph: 'auth' },
  ];
  const NW = 98, NH = 66, NY = 224;             // размеры/позиция узлов
  const cx = 230, coreY = 150;                  // ядро
  const ink = '#5b8cff', ink2 = '#7fa6ef', dim = '#3a557f';

  return (
    <div className="relative animate-scale-in w-full max-w-md mx-auto lg:max-w-none">
      <div className="bp-sheet p-4 sm:p-5">
        {/* Штамп-шапка чертежа */}
        <div className="relative flex items-center justify-between mb-2 text-[11px] font-mono" style={{ color: ink2 }}>
          <span className="inline-flex items-center gap-1.5 tracking-wide">
            <span className="inline-block h-1.5 w-1.5 rounded-full bp-pulse" style={{ background: '#5ee0c8' }} />
            ROBOWEB · {ru ? 'СХЕМА ПРОЕКТА' : 'PROJECT SCHEMATIC'}
          </span>
          <span style={{ color: dim }}>№ RW-01</span>
        </div>

        <div className="bp-scan" />

        <svg viewBox="0 0 460 470" className="relative w-full" style={{ display: 'block' }}>
          <defs>
            <marker id="bpArrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0 0L6 3L0 6Z" fill={ink} />
            </marker>
            <filter id="bpGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── ПРОМПТ ── */}
          <g className="bp-node" style={{ animationDelay: '.2s' }}>
            <rect x="150" y="18" width="160" height="42" rx="9" fill="#0e1a30" stroke={ink} strokeWidth="1.4" />
            <path d="M166 39 l7 -7 3 3 -7 7 -4 1 1 -4Z" fill="none" stroke={ink2} strokeWidth="1.3" />
            <text x="196" y="43" fill="#cfe0ff" fontSize="12" fontFamily="ui-monospace, monospace">{ru ? '«Опишите идею»' : '"Describe idea"'}</text>
          </g>

          {/* линия промпт → ядро */}
          <path className="bp-draw" style={{ ['--len' as string]: 60, animationDelay: '.6s' }}
                d={`M${cx} 60 V${coreY - 40}`} fill="none" stroke={ink} strokeWidth="1.6" markerEnd="url(#bpArrow)" />

          {/* ── ЯДРО ИИ ── */}
          <g className="bp-node" style={{ animationDelay: '.95s' }}>
            <circle cx={cx} cy={coreY} r="30" fill="none" stroke={ink} strokeWidth="1.5" opacity=".5" className="bp-pulse" filter="url(#bpGlow)" />
            <circle cx={cx} cy={coreY} r="24" fill="#0f213f" stroke={ink} strokeWidth="1.6" />
            {/* робо-глиф */}
            <rect x={cx - 11} y={coreY - 9} width="22" height="17" rx="4" fill="none" stroke={ink2} strokeWidth="1.4" />
            <circle cx={cx - 4} cy={coreY - 1} r="1.7" fill={ink2} /><circle cx={cx + 4} cy={coreY - 1} r="1.7" fill={ink2} />
            <path d={`M${cx} ${coreY - 9} V${coreY - 15}`} stroke={ink2} strokeWidth="1.4" /><circle cx={cx} cy={coreY - 16} r="1.6" fill={ink2} />
          </g>

          {/* ── ВЕТВИ ядро → 4 узла ── */}
          {nodes.map((n, i) => {
            const nx = n.x + NW / 2;
            return (
              <path key={`br-${i}`} className="bp-draw" style={{ ['--len' as string]: 160, animationDelay: `${1.2 + i * 0.12}s` }}
                    d={`M${cx} ${coreY + 30} C${cx} ${coreY + 70}, ${nx} ${NY - 40}, ${nx} ${NY}`}
                    fill="none" stroke={dim} strokeWidth="1.4" strokeDasharray="1 0" markerEnd="url(#bpArrow)" />
            );
          })}

          {/* ── УЗЛЫ фуллстека ── */}
          {nodes.map((n, i) => (
            <g key={`nd-${i}`} className="bp-node" style={{ animationDelay: `${1.55 + i * 0.12}s` }}>
              <rect x={n.x} y={NY} width={NW} height={NH} rx="8" fill="#0d1830" stroke={ink2} strokeWidth="1.3" />
              <g transform={`translate(${n.x + NW / 2 - 12}, ${NY + 12})`} stroke={ink} strokeWidth="1.5" fill="none">
                {n.glyph === 'screen' && (<><rect x="0" y="0" width="24" height="17" rx="2" /><path d="M0 5 H24" /><circle cx="3" cy="2.5" r=".8" fill={ink} stroke="none" /></>)}
                {n.glyph === 'api' && (<><path d="M8 0 L2 8 L8 16" /><path d="M16 0 L22 8 L16 16" /></>)}
                {n.glyph === 'db' && (<><ellipse cx="12" cy="4" rx="10" ry="3.5" /><path d="M2 4 V14 A10 3.5 0 0 0 22 14 V4" /><path d="M2 9 A10 3.5 0 0 0 22 9" /></>)}
                {n.glyph === 'auth' && (<><circle cx="7" cy="7" r="5" /><path d="M11 10 L20 19 M17 16 l3 -1 -1 3" /></>)}
              </g>
              <text x={n.x + NW / 2} y={NY + 52} fill="#cfe0ff" fontSize="12" fontFamily="ui-monospace, monospace" textAnchor="middle">{n.label}</text>
            </g>
          ))}

          {/* ── СХОЖДЕНИЕ узлы → GitHub ── */}
          {nodes.map((n, i) => {
            const nx = n.x + NW / 2;
            return (
              <path key={`cv-${i}`} className="bp-draw" style={{ ['--len' as string]: 190, animationDelay: `${2.15 + i * 0.1}s` }}
                    d={`M${nx} ${NY + NH} C${nx} ${NY + NH + 46}, ${cx} 356, ${cx} 384`}
                    fill="none" stroke={dim} strokeWidth="1.3" />
            );
          })}

          {/* ── ВЫГРУЗКА В GITHUB ── */}
          <g className="bp-node" style={{ animationDelay: '2.7s' }}>
            <rect x="118" y="388" width="224" height="52" rx="11" fill="#4C7DF0" filter="url(#bpGlow)" />
            <rect x="118" y="388" width="224" height="52" rx="11" fill="#4C7DF0" />
            <g transform="translate(146, 405)" fill="#fff">
              <path d="M11 0 C4.9 0 0 4.9 0 11 c0 4.9 3.2 9 7.6 10.5 .55 .1 .75 -.24 .75 -.53 v-1.85 c-3.1 .67 -3.75 -1.5 -3.75 -1.5 -.5 -1.3 -1.24 -1.64 -1.24 -1.64 -1 -.7 .08 -.68 .08 -.68 1.1 .08 1.7 1.14 1.7 1.14 1 1.7 2.6 1.2 3.24 .92 .1 -.72 .4 -1.2 .72 -1.48 -2.5 -.28 -5.1 -1.25 -5.1 -5.56 0 -1.23 .44 -2.23 1.16 -3.02 -.12 -.28 -.5 -1.42 .1 -2.96 0 0 .95 -.3 3.1 1.15 a10.7 10.7 0 0 1 5.65 0 c2.15 -1.45 3.1 -1.15 3.1 -1.15 .6 1.54 .22 2.68 .1 2.96 .72 .8 1.16 1.8 1.16 3.02 0 4.32 -2.62 5.27 -5.13 5.55 .4 .35 .76 1.04 .76 2.1 v3.1 c0 .3 .2 .64 .76 .53 A11 11 0 0 0 22 11 C22 4.9 17.1 0 11 0Z" />
            </g>
            <text x="248" y="420" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Montserrat, sans-serif" textAnchor="middle">{ru ? 'в ваш GitHub' : 'to your GitHub'}</text>
          </g>

          {/* ── АННОТАЦИИ «от руки» (размерные линии + подписи) ── */}
          <g className="bp-node" style={{ animationDelay: '3s' }} fontFamily="ui-monospace, monospace" fontSize="10.5" fill={ink2}>
            {/* слева: Next.js + Prisma */}
            <path d={`M18 ${coreY} H70`} stroke={dim} strokeWidth="1" strokeDasharray="3 3" />
            <path d={`M18 ${coreY - 4} V${coreY + 4}`} stroke={dim} strokeWidth="1" />
            <text x="20" y={coreY - 8}>Next.js + Prisma</text>
            {/* справа: HTTPS / SSL */}
            <path d={`M452 ${NY + NH + 22} H404`} stroke={dim} strokeWidth="1" strokeDasharray="3 3" />
            <text x="452" y={NY + NH + 18} textAnchor="end">HTTPS · SSL</text>
            {/* низ-право (пустая зона): данные в вашей PostgreSQL */}
            <text x="452" y="352" textAnchor="end" fill={dim}>{ru ? 'данные → PostgreSQL' : 'data → PostgreSQL'}</text>
            {/* низ-лево: фикс-цена, не почасовка */}
            <text x="8" y="352" fill={dim}>{ru ? 'фикс-цена' : 'fixed price'}</text>
          </g>
        </svg>
      </div>

      {/* Подпись под чертежом */}
      <p className="mt-3 text-center text-xs text-muted-foreground inline-flex w-full items-center justify-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: ink }} />
        {ru ? 'Проект собирается на глазах — и код остаётся у вас' : 'The project assembles live — and the code stays yours'}
      </p>
    </div>
  );
}
