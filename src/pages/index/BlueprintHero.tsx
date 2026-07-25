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
            <g transform="translate(131, 406)" fill="#fff">
              <path d="M10 0 C4.5 0 0 4.5 0 10 c0 4.4 2.9 8.2 6.9 9.5 .5 .1 .68 -.22 .68 -.48 v-1.7 c-2.8 .6 -3.4 -1.35 -3.4 -1.35 -.46 -1.16 -1.12 -1.47 -1.12 -1.47 -.9 -.62 .07 -.6 .07 -.6 1 .07 1.53 1.03 1.53 1.03 .9 1.54 2.36 1.1 2.94 .84 .1 -.66 .36 -1.1 .65 -1.35 -2.27 -.26 -4.65 -1.14 -4.65 -5.05 0 -1.12 .4 -2.03 1.05 -2.75 -.1 -.26 -.46 -1.3 .1 -2.7 0 0 .86 -.27 2.82 1.05 a9.7 9.7 0 0 1 5.13 0 c1.95 -1.32 2.8 -1.05 2.8 -1.05 .56 1.4 .2 2.44 .1 2.7 .65 .72 1.05 1.63 1.05 2.75 0 3.93 -2.4 4.8 -4.67 5.05 .37 .32 .7 .95 .7 1.9 v2.8 c0 .27 .18 .58 .7 .48 A10 10 0 0 0 20 10 C20 4.5 15.5 0 10 0Z" />
            </g>
            <text x="256" y="420" fill="#fff" fontSize="13.5" fontWeight="700" fontFamily="Montserrat, sans-serif" textAnchor="middle">{ru ? 'в GitHub / GitFlic' : 'to GitHub / GitFlic'}</text>
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
