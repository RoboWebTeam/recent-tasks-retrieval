/**
 * Генерирует public/sitemap.xml из РЕАЛЬНЫХ данных проекта.
 *
 * Раньше карта правилась руками и разошлась с кодом: в ней не было страницы тарифов (самой
 * коммерческой), зато была страница входа, а один адрес статьи содержал кириллицу внутри
 * латинского слага. Теперь список собирается из src/data/blog.ts, поэтому расходиться нечему.
 *
 * Запускается в npm run build до vite build.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://roboweb.dev';

// Публичные страницы. Кабинет, редактор, вход и служебные разделы сюда не попадают:
// карта сайта — это список страниц, которые мы ХОТИМ видеть в поиске.
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/register', priority: '0.7', changefreq: 'monthly' },
  { path: '/oferta', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/personal-data', priority: '0.3', changefreq: 'yearly' },
];

const blogSrc = readFileSync(resolve(ROOT, 'src/data/blog.ts'), 'utf8');
const slugs = [...blogSrc.matchAll(/"slug":\s*"([^"]+)"/g)].map(m => m[1]);

const bad = slugs.filter(s => !/^[a-z0-9-]+$/.test(s));
if (bad.length) {
  console.error('Недопустимые слаги статей (только a-z, 0-9 и дефис):', bad);
  process.exit(1);
}
if (!slugs.length) {
  console.error('Не найдено ни одной статьи в src/data/blog.ts — карта сайта не собрана');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const urls = [
  ...STATIC_PAGES.map(p => ({ loc: BASE + p.path, priority: p.priority, changefreq: p.changefreq })),
  ...slugs.map(s => ({ loc: `${BASE}/blog/${s}`, priority: '0.6', changefreq: 'monthly' })),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9"\n'.replace('sitemap.org', 'sitemaps.org') +
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  urls.map(u =>
    '  <url>\n' +
    `    <loc>${u.loc}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>${u.changefreq}</changefreq>\n` +
    `    <priority>${u.priority}</priority>\n` +
    '  </url>\n'
  ).join('') +
  '</urlset>\n';

writeFileSync(resolve(ROOT, 'public/sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml: ${urls.length} адресов (${slugs.length} статей)`);
