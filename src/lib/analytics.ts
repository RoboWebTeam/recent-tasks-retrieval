declare global {
  interface Window {
    ym?: (counterId: number, action: string, target: string, params?: Record<string, unknown>) => void;
  }
}

const YM_COUNTER_ID = 101026698;

/** Отправляет достижение цели в Яндекс.Метрику. Безопасно — если счётчик не успел
 * загрузиться (например заблокирован блокировщиком рекламы), просто ничего не делает. */
export function trackGoal(target: string, params?: Record<string, unknown>) {
  try {
    window.ym?.(YM_COUNTER_ID, 'reachGoal', target, params);
  } catch {
    /* аналитика не должна ломать основной функционал */
  }
}

export const GOALS = {
  REGISTRATION_SUCCESS: 'registration_success',
  LOGIN_SUCCESS: 'login_success',
  OAUTH_GITHUB_SUCCESS: 'oauth_github_success',
  OAUTH_YANDEX_SUCCESS: 'oauth_yandex_success',
  PROJECT_CREATED: 'project_created',
  WEBSITE_GENERATED_FIRST: 'website_generated_first',
  WEBSITE_PUBLISHED: 'website_published',
  PAYMENT_INITIATED: 'payment_initiated',
  ENERGY_PURCHASE_INITIATED: 'energy_purchase_initiated',
  PAYMENT_SUCCESS: 'payment_success',
} as const;