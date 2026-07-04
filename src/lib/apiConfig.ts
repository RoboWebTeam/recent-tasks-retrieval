// Единая точка настройки адресов backend-функций.
//
// По умолчанию проект обращается к облачным функциям poehali.dev.
// Если задать переменную окружения VITE_API_BASE_URL (например при сборке
// для собственного сервера: VITE_API_BASE_URL=https://roboweb.site),
// все запросы автоматически пойдут на `${VITE_API_BASE_URL}/api/<имя-функции>`
// — это соответствует прокси-настройке nginx из деплой-инструкции (deploy/README.md).

const FUNCTION_IDS = {
  auth: '1c31dd39-a734-4b06-bc38-a2e25d8ad7cf',
  'user-projects': '2b772da8-0a47-4371-97c7-b0a6834cdf0e',
  'site-files': '86596285-1259-4cdb-8c8d-48a19c6f94df',
  'public-site': '2c23b134-6798-4837-b6b2-226e599051f9',
  domains: '8e970c92-49ad-4f27-9b52-3572f6efc1f6',
  'project-core': '7aaaa29f-7484-4295-83d3-fbc7eaf6e923',
  'generate-image': '6a25f90e-ad5e-4f64-abf2-45b6b515b915',
  'generate-site': '64b3e52e-6bb5-4d4e-b7ee-e3840af35990',
  'plan-pricing': 'b66b5f92-bcdf-4605-87e2-b42e3d90e6ff',
  'send-email': '4272fc80-99e8-4abe-8f09-7dce2b50bc57',
  'get-leads': '30e5ede9-3024-46d5-ad27-eae4b46b0056',
  'manage-user': 'f00990ba-30f7-4fe5-9cb2-974518f45564',
  analytics: 'ee6777e6-59d0-4d5f-acb2-d292c72253d3',
  'site-leads': '96a428e9-25c5-47d2-83b1-bdc68f9f8010',
  'activity-log': 'fa0bbc9f-ff34-4d08-877f-41fdf35d0dee',
  'support-chat': '0ddd7998-ad2d-433a-a6ef-5801b4ed059b',
  'yookassa-yookassa': '4fec45e4-aaef-4bc4-ba3c-7a43dfc964bc',
  'order-status': '0883717d-f728-467e-b5d2-c91fb10bf3e6',
  'ai-balance': '6c9f46a5-6772-44a1-92bb-278ae6386b19',
  'energy-pricing': '610d2b17-ab5a-496c-8fe9-1fdbd061dcc8',
} as const;

export type FunctionName = keyof typeof FUNCTION_IDS;

const CUSTOM_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

/** Возвращает адрес backend-функции: облачный (по умолчанию) или собственный сервер, если задан VITE_API_BASE_URL. */
export function apiUrl(name: FunctionName): string {
  if (CUSTOM_BASE) return `${CUSTOM_BASE}/api/${name}`;
  return `https://functions.poehali.dev/${FUNCTION_IDS[name]}`;
}