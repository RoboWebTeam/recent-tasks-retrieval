// Единая точка настройки адресов backend-функций.
//
// По умолчанию запросы идут на тот же домен, что и фронтенд: `/api/<имя-функции>`
// (backend проксируется через nginx — см. deploy/README.md).
// Можно указать другой адрес backend через VITE_API_BASE_URL при сборке
// (например: VITE_API_BASE_URL=https://roboweb.site) — тогда запросы пойдут на
// `${VITE_API_BASE_URL}/api/<имя-функции>`.

const FUNCTION_NAMES = [
  'auth',
  'user-projects',
  'site-files',
  'public-site',
  'domains',
  'project-core',
  'generate-site',
  'plan-pricing',
  'send-email',
  'get-leads',
  'manage-user',
  'analytics',
  'site-leads',
  'activity-log',
  'support-chat',
  'yookassa-yookassa',
  'order-status',
  'energy-pricing',
] as const;

export type FunctionName = typeof FUNCTION_NAMES[number];

const CUSTOM_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

/** Возвращает адрес backend-функции: на тот же домен (`/api/<имя>`) или на VITE_API_BASE_URL, если задан. */
export function apiUrl(name: FunctionName): string {
  return CUSTOM_BASE ? `${CUSTOM_BASE}/api/${name}` : `/api/${name}`;
}