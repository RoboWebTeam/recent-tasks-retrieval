import { apiUrl } from '@/lib/apiConfig';

export interface ProPlanOption {
  plan_code: string;
  requests: number;
  price: number;
}

export const PLAN_PRICING_URL = apiUrl('plan-pricing');

export const FALLBACK_PRO_PLANS: ProPlanOption[] = [
  { plan_code: 'pro_60', requests: 60, price: 1990 },
  { plan_code: 'pro_80', requests: 80, price: 2990 },
  { plan_code: 'pro_200', requests: 200, price: 4990 },
  { plan_code: 'pro_400', requests: 400, price: 9990 },
  { plan_code: 'pro_800', requests: 800, price: 19990 },
];

export const PRO_PLAN_DETAILS: Record<string, { ru: string[]; en: string[] }> = {
  pro_60: {
    ru: ['До 5 проектов', 'База данных 1 ГБ', 'Хранилище 5 ГБ', '25 функций', '250 ч вычислений'],
    en: ['Up to 5 projects', '1 GB database', '5 GB storage', '25 functions', '250h compute'],
  },
  pro_80: {
    ru: ['До 8 проектов', 'База данных 1 ГБ', 'Хранилище 10 ГБ', '50 функций', '417 ч вычислений'],
    en: ['Up to 8 projects', '1 GB database', '10 GB storage', '50 functions', '417h compute'],
  },
  pro_200: {
    ru: ['До 10 проектов', 'База данных 2 ГБ', 'Хранилище 20 ГБ', '100 функций', '833 ч вычислений'],
    en: ['Up to 10 projects', '2 GB database', '20 GB storage', '100 functions', '833h compute'],
  },
  pro_400: {
    ru: ['До 20 проектов', 'База данных 4 ГБ', 'Хранилище 40 ГБ', '200 функций', '1667 ч вычислений'],
    en: ['Up to 20 projects', '4 GB database', '40 GB storage', '200 functions', '1667h compute'],
  },
  pro_800: {
    ru: ['До 50 проектов', 'База данных 10 ГБ', 'Хранилище 100 ГБ', '500 функций', '4167 ч вычислений'],
    en: ['Up to 50 projects', '10 GB database', '100 GB storage', '500 functions', '4167h compute'],
  },
};

export const getProRequestsLabel = (requests: number, lang: 'ru' | 'en') =>
  lang === 'ru' ? `${requests} запросов в месяц` : `${requests} requests/month`;