// Лёгкий файл с категориями портфолио — импортируется статически (используется сразу для рендера фильтров),
// в отличие от данных портфолио в portfolioData.ts, которые грузятся отдельным чанком.
// Направление: премиум бизнес-решения (магазины, маркетплейсы, порталы, дашборды, лендинги).
export type DemoCategory = 'all' | 'ecommerce' | 'portal' | 'saas' | 'landing';

export const DEMO_CATEGORIES_RU: { id: DemoCategory; label: string }[] = [
  { id: 'all',       label: 'Все решения' },
  { id: 'ecommerce', label: 'Магазины и маркетплейсы' },
  { id: 'portal',    label: 'Порталы и платформы' },
  { id: 'saas',      label: 'SaaS и дашборды' },
  { id: 'landing',   label: 'Премиум-лендинги' },
];

export const DEMO_CATEGORIES_EN: { id: DemoCategory; label: string }[] = [
  { id: 'all',       label: 'All solutions' },
  { id: 'ecommerce', label: 'Stores & marketplaces' },
  { id: 'portal',    label: 'Portals & platforms' },
  { id: 'saas',      label: 'SaaS & dashboards' },
  { id: 'landing',   label: 'Premium landings' },
];
