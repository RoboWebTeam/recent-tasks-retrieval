/**
 * Пререндер публичных страниц после сборки.
 *
 * Зачем. Приложение одностраничное: сервер отдаёт пустой каркас, а весь текст рисует JS.
 * Проверено на живом сайте — робот Яндекса, запросив статью блога, получал ноль символов
 * текста в теле документа и мета-теги ГЛАВНОЙ страницы. То есть все статьи выглядели для
 * поиска одной и той же пустой страницей.
 *
 * Как. Поднимаем собранный dist локальным сервером, обходим его настоящим браузером, ждём
 * пока приложение отрисует содержимое, и сохраняем получившийся HTML как статический файл.
 * Дальше nginx отдаёт роботу готовую страницу с текстом, заголовком и описанием, а живому
 * посетителю приложение как обычно подхватывает управление поверх этой разметки.
 *
 * Запускается в npm run build после vite build.
 */
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const PORT = Number(process.env.PRERENDER_PORT || 4321);
/** Сколько ждать появления содержимого на странице, мс. */
const WAIT_MS = Number(process.env.PRERENDER_WAIT_MS || 15000);

// ── Список страниц ────────────────────────────────────────────────────────────────
// Ровно те же публичные адреса, что и в карте сайта. Кабинет, редактор и вход не трогаем:
// их в поиске быть не должно, а рисовать их без сессии всё равно нечем.
const blogSrc = await readFile(resolve(ROOT, 'src/data/blog.ts'), 'utf8');
const slugs = [...blogSrc.matchAll(/"slug":\s*"([^"]+)"/g)].map(m => m[1]);

const ROUTES = [
  '/',
  '/pricing',
  '/blog',
  '/register',
  '/oferta',
  '/privacy',
  '/personal-data',
  ...slugs.map(s => `/blog/${s}`),
];

/** Отдельная страница для ответа 404. Раньше несуществующий адрес отдавал код 200 с
 *  содержимым главной — то есть любая опечатка в ссылке порождала «страницу», а поисковик
 *  видел бесконечные дубли главной. Файл кладём в dist/404.html, его подставляет nginx. */
const NOT_FOUND_ROUTE = '/__404__';

// ── Локальный сервер над dist ─────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const filePath = join(DIST, decodeURIComponent(url.pathname));
  try {
    if (extname(url.pathname) && existsSync(filePath)) {
      const buf = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(url.pathname)] || 'application/octet-stream' });
      return res.end(buf);
    }
    // Любой маршрут приложения — отдаём каркас, как это делает nginx.
    const shell = await readFile(join(DIST, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(shell);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise(ok => server.listen(PORT, '127.0.0.1', ok));

// ── Браузер ───────────────────────────────────────────────────────────────────────
let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  console.warn('[пререндер] puppeteer не установлен — пропускаю. Сайт соберётся, но останется '
    + 'одностраничным для поисковика. Установите: npm i -D puppeteer');
  server.close();
  process.exit(0);
}

const launchOpts = {
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
};
// В Docker-сборке ставится системный chromium (в alpine-образе бандл puppeteer не запускается).
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

const browser = await puppeteer.launch(launchOpts);
let ok = 0;
const failed = [];

for (const route of [...ROUTES, NOT_FOUND_ROUTE]) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });
    // Язык интерфейса фиксируем русским: сайт русскоязычный, и снимки должны быть русскими
    // независимо от локали машины, на которой идёт сборка.
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('lang', 'ru'); } catch { /* приватный режим */ }
    });
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: WAIT_MS });
    // Ждём, пока появится осмысленное содержимое, а не пустой каркас. У страницы «не найдено»
    // текста мало по своей природе, поэтому порог для неё ниже.
    const minChars = route === NOT_FOUND_ROUTE ? 40 : 200;
    await page.waitForFunction(
      (min) => {
        const root = document.getElementById('root');
        return !!root && root.innerText.trim().length > min && !!document.querySelector('h1');
      },
      { timeout: WAIT_MS },
      minChars,
    );

    const html = await page.evaluate(() => {
      // Курсор печатающей анимации в статике выглядит мусором — убираем из снимка.
      document.querySelectorAll('.typed-cursor').forEach(el => el.remove());
      return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    });

    if (route === NOT_FOUND_ROUTE) {
      await writeFile(join(DIST, '404.html'), html, 'utf8');
    } else {
      const outDir = route === '/' ? DIST : join(DIST, route);
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, 'index.html'), html, 'utf8');
    }

    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    console.log(`  ${route.padEnd(46)} ${String(html.length).padStart(7)} байт · текста ${text.split(/\s+/).filter(Boolean).length} слов`);
    ok++;
  } catch (e) {
    failed.push(`${route}: ${String(e).slice(0, 120)}`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

console.log(`[пререндер] готово: ${ok} из ${ROUTES.length + 1}`);
if (failed.length) {
  console.error('[пререндер] НЕ УДАЛОСЬ:\n  ' + failed.join('\n  '));
  // Падаем: молча выкатить сайт, где часть страниц осталась пустой для поисковика, хуже,
  // чем упавшая сборка — пустую страницу никто не заметит месяцами.
  process.exit(1);
}
