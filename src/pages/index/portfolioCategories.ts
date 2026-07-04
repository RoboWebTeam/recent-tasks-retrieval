// Лёгкий файл с категориями портфолио — импортируется статически (используется сразу для рендера фильтров),
// в отличие от тяжёлых данных 63 демо-сайтов в portfolioData.ts, которые грузятся отдельным чанком.
export type DemoCategory = 'all' | 'food' | 'services' | 'store' | 'business' | 'tech' | 'other';

export const DEMO_CATEGORIES_RU: { id: DemoCategory; label: string }[] = [
  { id: 'all',      label: '✦ Все' },
  { id: 'food',     label: '🍽 Общепит' },
  { id: 'services', label: '💼 Услуги' },
  { id: 'store',    label: '🛍 Магазины' },
  { id: 'business', label: '🏢 Бизнес' },
  { id: 'tech',     label: '💻 IT и технологии' },
  { id: 'other',    label: '🎯 Другое' },
];

export const DEMO_CATEGORIES_EN: { id: DemoCategory; label: string }[] = [
  { id: 'all',      label: '✦ All' },
  { id: 'food',     label: '🍽 Food' },
  { id: 'services', label: '💼 Services' },
  { id: 'store',    label: '🛍 Stores' },
  { id: 'business', label: '🏢 Business' },
  { id: 'tech',     label: '💻 IT & Tech' },
  { id: 'other',    label: '🎯 Other' },
];
