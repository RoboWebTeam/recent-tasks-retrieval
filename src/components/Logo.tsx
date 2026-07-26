/** Фирменный знак Roboweb — единая точка правды для логотипа.
 *  Раньше логотип был стоковой иконкой lucide "Bot", размазанной по 18 местам; теперь марка в одном файле.
 *  Знак: геометрическая монограмма «R» + блок текстового курсора на той же базовой линии —
 *  активная строка кода, где ИИ-команда прямо сейчас пишет продукт.
 *
 *  <LogoMark/>   — знак в фирменной плитке (как в шапке/футере): белая монограмма на градиенте
 *  <RoboMark/>   — «голый» знак (градиентный) для светлых/тёмных поверхностей без плитки
 *  <LogoLockup/> — плитка + слово «Roboweb» */

/** Пути монограммы: R (с вырезом в чаше) + ножка + курсор. */
function MarkPaths({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5 7h22a15 15 0 0 1 0 30H15v20H5V7Zm10 10h12a5 5 0 0 1 0 10H15V17Z" />
      <path d="M21 31h10.5L38 57H27.5L21 31Z" />
      <rect x="47" y="31" width="12" height="26" rx="3" />
    </g>
  );
}

/** «Голый» знак — градиентный, для поверхностей без плитки. */
export function RoboMark({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Roboweb">
      <defs>
        <linearGradient id="rwMarkGrad" x1="5" y1="5" x2="59" y2="59" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(258 76% 64%)" />
        </linearGradient>
      </defs>
      <MarkPaths fill="url(#rwMarkGrad)" />
    </svg>
  );
}

/** Знак в фирменной плитке — основной вид логотипа (белая монограмма на градиенте). */
export function LogoMark({ size = 36, className = '', pulse = false }: { size?: number; className?: string; pulse?: boolean }) {
  return (
    <span
      className={`relative inline-grid place-items-center shrink-0 rounded-xl bg-gradient-to-br from-primary to-[hsl(258,76%,64%)] shadow-lg shadow-primary/25 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 64 64" fill="none"
        xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Roboweb">
        <MarkPaths fill="#fff" />
      </svg>
      {pulse && <span className="absolute inset-0 rounded-xl animate-pulse-ring bg-primary/40" aria-hidden="true" />}
    </span>
  );
}

/** Плитка + слово «Roboweb» — готовый логотип для шапок. */
export function LogoLockup({
  size = 36, textClass = 'text-lg md:text-xl', className = '', pulse = false,
}: { size?: number; textClass?: string; className?: string; pulse?: boolean }) {
  return (
    <span className={`flex items-center gap-2 font-display font-extrabold ${textClass} ${className}`}>
      <LogoMark size={size} pulse={pulse} />
      Roboweb
    </span>
  );
}
