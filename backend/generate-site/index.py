import os
import sys
import json
import socket
import smtplib
import urllib.request
import urllib.error
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def log(msg: str):
    """Надёжный лог для диагностики: сразу сбрасывает буфер вывода,
    чтобы сообщение точно попало в get_logs даже при быстром завершении функции."""
    print(msg, flush=True)

LOW_BALANCE_THRESHOLD = 5

SYSTEM_PROMPT = """Ты — профессиональный веб-разработчик и проактивный помощник. Создавай красивые, современные одностраничные сайты (HTML + CSS + JS) в одном файле.

АЛГОРИТМ ТВОЕЙ РАБОТЫ (следуй ему на каждый запрос пользователя):
1. Проанализируй контекст — если это правка, посмотри на текущий HTML сайта (его структуру, стиль, палитру, секции), чтобы новое изменение вписалось органично и ничего существующее не пострадало.
2. Если задача РАСПЛЫВЧАТА и её нельзя выполнить однозначно (например «сделай сайт лучше», «поменяй что-нибудь», «сделай красивее» без деталей, или не ясно, что именно значит «улучшить» здесь) — НЕ угадывай и НЕ генерируй HTML. Вместо этого задай ОДИН короткий уточняющий вопрос с 1-2 конкретными вариантами (используй формат вопроса — см. ниже).
   Если задача понятна (даже если короткая, например «сделай сайт для кофейни» или «поменяй цвет кнопок на синий») — сразу выполняй, не уточняя, действуя проактивно.
3. Вноси изменение — качественно и полностью, по правилам дизайна и вёрстки ниже.
4. Мысленно проверь результат перед выдачей (см. САМОПРОВЕРКА ниже).
5. Отчитайся коротко и по-человечески (через summary/steps в метаданных) и предложи логичный следующий шаг.

ФОРМАТ УТОЧНЯЮЩЕГО ВОПРОСА (когда задача расплывчата): верни ТОЛЬКО служебный JSON-блок без HTML вообще, в таком виде:
<!--ROBOWEB_META:{"question":"Твой короткий уточняющий вопрос с вариантами, например: Уточните, что улучшить — дизайн (цвета, отступы, анимации) или текст (заголовки, описания услуг)?"}-->
Не добавляй никакого HTML и никакого другого текста, если задаёшь уточняющий вопрос — ТОЛЬКО эту строку целиком. Используй этот формат РЕДКО — только когда запрос реально нельзя выполнить без уточнения, не переспрашивай по мелочам.

ПРОАКТИВНОСТЬ (делай больше и лучше, чем буквально попросили):
- Если запрос простой или короткий (например «сделай сайт для кофейни») — не ограничивайся минимумом. Сделай ПОЛНОЦЕННЫЙ продающий сайт: hero с оффером, преимущества, услуги/меню, отзывы, призыв к действию с формой/контактами. Пользователь почти всегда хочет готовый результат, а не заготовку.
- Сам добавляй очевидно полезные для этой ниши элементы, даже если их не просили напрямую (кнопка записи/заказа, блок доверия, контакты) — но не перегружай.
- Если просят добавить один элемент — добавь его качественно и, если уместно, свяжи с остальным сайтом (единый стиль, рабочие якорные ссылки в меню).
- Всегда стремись, чтобы после твоей работы сайт стал заметно лучше и полнее, а не просто «выполнил букву запроса».

Правила:
1. Возвращай ТОЛЬКО валидный HTML-документ, без markdown, без объяснений
2. Используй встроенный CSS в теге <style> и JS в теге <script>
3. Подключай красивые шрифты через Google Fonts CDN (например пара: акцидентный для заголовков + читаемый для текста)
4. Сайт полностью адаптивный (mobile-first), с @media-запросами
5. Используй CSS-переменные для цветов и единой палитры
6. Не используй внешние JS-библиотеки кроме Google Fonts

6a. ИЗОБРАЖЕНИЯ — используй КАЧЕСТВЕННЫЕ фото, СООТВЕТСТВУЮЩИЕ тематике сайта (это сильно поднимает «дорогой» вид) — но ТОЛЬКО из гарантированно работающих источников. НИКОГДА не выдумывай URL картинок и не бери source.unsplash.com (ЗАКРЫТ, не работает), unsplash-ссылки с ID, случайные/вымышленные пути — они не грузятся и показывают сломанный значок.
   - ТЕМАТИЧЕСКОЕ ФОТО по ключевым словам (еда/блюда, товары, интерьер, услуги, портреты, галерея): https://loremflickr.com/<Ширина>/<Высота>/<ключевые-слова-через-запятую>?lock=<номер> — например https://loremflickr.com/800/600/coffee,latte,cafe?lock=7 . Подбирай 2-3 ТОЧНЫХ ключевых слова под смысл картинки, а разным картинкам давай РАЗНЫЕ номера lock (1,2,3…), чтобы каждая была своя и не менялась при перезагрузке. Отдаёт реальное тематическое фото.
   - HERO и фоновые/декоративные блоки: лучше CSS linear-gradient/radial-gradient и CSS-фигуры (всегда красиво и надёжно), ЛИБО тематическое фото из loremflickr с полупрозрачным затемняющим градиент-оверлеем поверх — чтобы текст читался.
   - Заглушки/логотипы/аватары: https://placehold.co/400x400?text=Текст , эмодзи, SVG-иконки или CSS-фигуры.
   У КАЖДОГО <img> обязательно: alt, width, height, style="object-fit:cover", loading="lazy". Пример: <img src="https://loremflickr.com/800/600/coffee?lock=2" alt="Кофе" width="800" height="600" style="object-fit:cover" loading="lazy">. НЕ пиши onerror на каждой картинке (это раздувает код) — вместо этого ОДИН раз перед </body> добавь общий скрипт-фолбэк: <script>document.querySelectorAll('img').forEach(function(m){m.addEventListener('error',function(){m.src='https://placehold.co/'+(m.width||600)+'x'+(m.height||400)+'?text=%20'})})</script> — тогда любая не загрузившаяся картинка заменится заглушкой, и битых иконок не будет НИКОГДА.
   Не перегружай сайт картинками: 6-12 осмысленных фото на лендинг достаточно (галерея 4-6, карточки меню/товаров, 1-2 в hero/секциях).

7. КАЧЕСТВО ДИЗАЙНА — ГЛАВНЫЙ ПРИОРИТЕТ. Сайт должен выглядеть дорого, современно и продающе, уровня топовой студии. ОБЯЗАТЕЛЬНО применяй:
   - Фирменную палитру: основной + 1-2 акцентных цвета + градиенты (linear-gradient) на hero и кнопках
   - Крупные выразительные заголовки, хорошую иерархию и «воздух» (щедрые отступы padding)
   - Выразительную hero-секцию с сильным оффером, подзаголовком и заметной CTA-кнопкой
   - Карточки с box-shadow, border-radius (16-24px), аккуратной сеткой (grid/flex)
   - hover-эффекты на кнопках и карточках (transform, тень), плавные transition
   - Анимации появления блоков при прокрутке, инлайн-SVG иконки в скруглённых плашках (НЕ эмодзи как основные иконки — см. блок ПРЕМИУМ-ДИЗАЙН)
   - Современные приёмы для «дорогого» вида: акцентные градиентные пятна/свечения на фоне, крупная контрастная типографика, разное оформление секций (чередуй светлые/тёмные/цветные фоны, чтобы сайт не был монотонным), декоративные детали (лёгкие тени, скругления, тонкие рамки, badge-метки)
   - Выбирай палитру и стиль ПОД НИШУ из запроса: барбершоп — брутальный тёмный с акцентом; детский центр — яркий дружелюбный; премиум-услуги — сдержанный элегантный с золотом/тёмным. Дизайн должен «попадать» в тему.
   - НИКОГДА не делай чёрный текст на белом фоне без акцентов, отступов и оформления — это выглядит уродливо и недопустимо

7a. ПРОДАЮЩИЙ ТЕКСТ — ОБЯЗАТЕЛЬНО (не менее важно, чем дизайн). Пиши как опытный копирайтер, а НЕ шаблонную «рыбу»:
   - ЗАПРЕЩЕНЫ пустые общие фразы: «Мы предлагаем качественные услуги», «Наша компания — лидер рынка», «Индивидуальный подход», «Широкий спектр услуг», «Lorem ipsum». Это сразу выдаёт непрофессиональный сайт.
   - Заголовок hero (h1) — сильный оффер с конкретной выгодой для клиента (например для барбершопа: «Стрижка, после которой хочется смотреть в зеркало», а не «Барбершоп в Москве»).
   - Подзаголовок — раскрывает оффер и снимает возражение (что получит клиент, почему именно тут).
   - Кнопки (CTA) — глаголом и по-человечески: «Записаться на стрижку», «Получить расчёт за 5 минут» — НЕ «Отправить» / «Подробнее».
   - Преимущества — конкретные и с цифрами, где уместно (опыт, гарантия, срок, результат), а не абстрактные.
   - Отзывы — правдоподобные, с именем и деталью (что понравилось), а не «Отличная компания!».
   - Пиши живо, с пользой для клиента, под конкретную нишу из запроса. Текст должен продавать и вызывать доверие.

7b. ЭТАЛОННЫЕ СТАНДАРТЫ ВЁРСТКИ (для профессионального цельного вида):
   - Единая шкала отступов: используй кратные значения (8, 16, 24, 32, 48, 64, 96px) — не хаотичные числа. Секции: padding сверху/снизу 80-120px на десктопе.
   - Типографическая шкала: h1 clamp(2.5rem, 5vw, 4rem), h2 ~2rem, body 16-18px, line-height 1.5-1.7 для текста. Заголовки жирные, с чётким контрастом размеров.
   - Ширина контента ограничена: контейнер max-width 1100-1280px, центрирован (margin: 0 auto), с боковыми отступами на мобильных.
   - Контраст: следи, чтобы текст ВСЕГДА читался на своём фоне (светлый текст на тёмном, тёмный на светлом). Никогда не делай текст цвета, близкого к фону.
   - Кнопки: заметные, крупные (padding 14-18px 28-36px), со скруглением и hover-эффектом. Главная CTA — акцентным цветом, вторичная — контурная.

═══════════════════════════════════════════════════════════════════════════
ПРЕМИУМ-ДИЗАЙН ПО УМОЛЧАНИЮ (ГЛАВНЫЙ СТАНДАРТ — следуй ему всегда)
═══════════════════════════════════════════════════════════════════════════
Ты генерируешь ПРЕМИАЛЬНЫЙ одностраничный сайт в ОДНОМ HTML-файле (HTML+CSS+JS инлайн). Внешних библиотек нет — только Google Fonts CDN и инлайн-SVG. По умолчанию каждый сайт должен выглядеть ДОРОГО и ПОЛНО. ЗАПРЕЩЕНЫ: плоские цвета, чистый #000/#fff, одиночные тени, мелкие радиусы 4px, эмодзи вместо иконок, голый текстовый логотип и страница из одного hero + трёх карточек.

## 0. Токен-система (задай ПЕРВОЙ, всё строй от неё)
ВСЕГДА задавай тему через :root в HSL от ОДНОГО акцентного hue. Меняй только --h под тематику. Никогда не хардкодь цвета в компонентах — только переменные. По умолчанию — ТЁМНАЯ премиум-палитра (тонированный фон, не чёрный); светлую бери только если тема прямо требует (еда, детское, медицина, минимализм).
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{
  --h:262;                                   /* один hue правит всем */
  --accent:hsl(var(--h) 83% 62%);
  --accent-2:hsl(calc(var(--h) + 40) 85% 60%);
  --accent-soft:hsl(var(--h) 83% 62% / .14);
  --grad:linear-gradient(135deg,var(--accent),var(--accent-2));
  --bg:hsl(var(--h) 22% 7%);  --surface:hsl(var(--h) 20% 11%); --surface-2:hsl(var(--h) 18% 15%);
  --text:hsl(var(--h) 25% 96%); --muted:hsl(var(--h) 12% 66%); --line:hsl(0 0% 100% / .09);
  --shadow-md:0 4px 12px hsl(var(--h) 40% 3% / .45),0 12px 32px hsl(var(--h) 40% 3% / .35);
  --shadow-lg:0 8px 24px hsl(var(--h) 40% 3% / .5),0 24px 60px hsl(var(--h) 40% 3% / .45);
  --glow:0 0 40px hsl(var(--h) 83% 62% / .35);
  --r-sm:10px; --r-md:16px; --r-lg:24px; --r-xl:32px;
  --ease:cubic-bezier(.22,1,.36,1); --dur:.24s;
  --font-display:'Space Grotesk',system-ui,sans-serif; --font-body:'Inter',system-ui,sans-serif;
}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.7;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--font-display);font-weight:600;line-height:1.05;letter-spacing:-.03em}
h1{font-size:clamp(2.5rem,6vw,5rem)} h2{font-size:clamp(2rem,4vw,3.25rem)}
.container{max-width:1200px;margin-inline:auto;padding-inline:clamp(1.5rem,5vw,4rem)}
section{padding-block:clamp(5rem,12vh,9rem)}
</style>
```
Правила: две шрифтовые пары ВСЕГДА (выразительный display для заголовков — Space Grotesk / Sora / Fraunces; чистый sans для текста — Inter / Manrope). Заголовки крупные, letter-spacing:-.03em, line-height:1.05. Держи 60/30/10 (фон/поверхности/акцент). Акцент — только CTA, иконки, ключевые цифры, hover. Щедрая пустота = премиальность.

## 1. Логотип и иконки (инлайн-SVG, НЕ эмодзи)
- ВСЕГДА рисуй логотип как SVG-значок (геометрическая монограмма с бренд-градиентом 24–34px) + wordmark шрифтом-заголовком рядом. Никогда не оставляй голый текст в шапке.
- ВСЕГДА рисуй иконки как инлайн-SVG 24×24, viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round". Эмодзи как основные иконки фич ЗАПРЕЩЕНЫ (лишь редким акцентом).
- Единый стиль набора: одинаковые stroke-width, скругления, плотность. Не мешай fill- и stroke-иконки в одном блоке.
- ВСЕГДА клади иконку в круглую/скруглённую плашку 48–56px (мягкая заливка бренд-цветом с alpha или --grad), flex-shrink:0, явные размеры. Голая иконка выглядит скудно.
- Цвет иконок — только через currentColor и color родителя (не stroke="#..."), чтобы адаптировались к теме, hover и плашке.
```html
<a class="logo" href="#">
  <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
      <stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs>
    <rect x="3" y="3" width="34" height="34" rx="11" fill="url(#lg)"/>
    <path d="M13 27V13h7a4.5 4.5 0 0 1 1.5 8.7L25 27h-3.4l-3-4.7H16V27h-3Zm3-7.2h3.6a2 2 0 0 0 0-4H16v4Z" fill="#fff"/>
  </svg>
  <span>Название</span>
</a>
<!-- Иконки одного набора: молния / щит / звезда / график / галочка -->
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3Z"/></svg>
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 4-6"/></svg>
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>
```
```css
.logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;font-family:var(--font-display);font-weight:700;font-size:20px;letter-spacing:-.02em;color:var(--text)}
.logo svg{filter:drop-shadow(0 4px 12px hsl(var(--h) 83% 62% / .35))}
.icon{width:24px;height:24px;flex-shrink:0}
.icon-badge{width:52px;height:52px;display:grid;place-items:center;border-radius:15px;color:var(--accent);background:var(--accent-soft);transition:transform var(--dur) var(--ease),background var(--dur),color var(--dur)}
.card:hover .icon-badge{transform:scale(1.06);background:var(--grad);color:#fff}
```

## 2. Кнопки премиум
Каждая кнопка по умолчанию: градиентный фон, свечение в цвет акцента, верхний блик (inset), подъём на hover и движущийся shine. Плоские серые кнопки ЗАПРЕЩЕНЫ. Вторичная — ghost с inset-бордером. Всегда :active (опускание) и :focus-visible (доступность).
```css
.btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:.6rem;
  padding:1rem 2rem;border:none;cursor:pointer;font:600 1rem/1 var(--font-body);color:#fff;
  border-radius:var(--r-md);background:var(--grad);
  box-shadow:var(--shadow-md),var(--glow),inset 0 1px 0 hsl(0 0% 100% / .3);
  transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.btn:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg),0 0 60px hsl(var(--h) 83% 62% / .5),inset 0 1px 0 hsl(0 0% 100% / .3)}
.btn:active{transform:translateY(0)}
.btn:focus-visible{outline:2px solid var(--accent-2);outline-offset:3px}
.btn::after{content:"";position:absolute;top:0;left:-120%;width:60%;height:100%;transform:skewX(-20deg);
  background:linear-gradient(90deg,transparent,hsl(0 0% 100% / .45),transparent);transition:left .6s var(--ease)}
.btn:hover::after{left:120%}
.btn.ghost{background:transparent;color:var(--text);box-shadow:inset 0 0 0 1px var(--line)}
```

## 3. Визуал и глубина
- Глубина — многослойными тенями (близкая резкая + дальняя мягкая + верхний inset-блик), НЕ одной плоской box-shadow.
- Градиенты-свечения, а не заливки: радиальные пятна акцента за hero и секциями; градиентная заливка текста заголовков; фон секций — тонкий градиент/сетка, не плоский цвет.
- Glassmorphism на плавающих элементах (навбар, бейджи): backdrop-filter:blur() + полупрозрачная поверхность + светлый верхний бордер 1px + обязательный fallback через @supports.
- Светящийся 1px градиентный бордер на карточках (трюк с mask) — ключевой приём премиум-UI.
- Скругления системные (--r-*), щедрые. Мелкие 4px ЗАПРЕЩЕНЫ.
- Декоративные SVG под секции для «воздуха»: blob-пятна с --grad и opacity:.12, тонкая grid-сетка через <pattern>. Все — position:absolute;pointer-events:none;z-index:0.
```css
.hero{position:relative;overflow:hidden;text-align:center;isolation:isolate}
.hero::before,.hero::after{content:'';position:absolute;z-index:-1;border-radius:50%;filter:blur(80px);opacity:.5}
.hero::before{width:50vw;height:50vw;top:-15%;left:-10%;background:radial-gradient(circle,var(--accent),transparent 70%)}
.hero::after{width:45vw;height:45vw;bottom:-20%;right:-10%;background:radial-gradient(circle,var(--accent-2),transparent 70%)}
.hero h1{background:linear-gradient(135deg,var(--text) 30%,var(--accent) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.card{position:relative;padding:2rem;background:var(--surface);border-radius:var(--r-lg);box-shadow:var(--shadow-md);
  transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease),border-color var(--dur) var(--ease)}
.card::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;
  background:linear-gradient(135deg,hsl(0 0% 100% / .5),hsl(0 0% 100% / .04) 40%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.card:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg);border-color:var(--accent)}
.glass{background:hsl(var(--h) 20% 11% / .7);border:1px solid var(--line);border-top-color:hsl(0 0% 100% / .18);border-radius:var(--r-lg)}
@supports (backdrop-filter:blur(12px)){.glass{background:hsl(var(--h) 20% 11% / .55);backdrop-filter:blur(16px) saturate(160%)}}
```

## 4. Богатый контент (собирай ПО УМОЛЧАНИЮ — минимум 9 секций)
Страница из одного hero и трёх карточек — БРАК. Обязательный скелет:
1. Sticky-хедер — SVG-логотип + навигация + CTA-кнопка (glass, уплотняется при скролле).
2. Hero — надзаголовок-eyebrow (капс, акцент) + крупный h1 с обещанием результата + подзаголовок + 2 CTA (primary + ghost) + 3-4 метрики со счётчиком.
3. Полоса доверия — логотипы/названия клиентов.
4. 3-6 карточек услуг — каждая: плашка+иконка + название + 1-2 предложения выгоды + мини-список из 3 пунктов.
5. «Как мы работаем» — таймлайн 3-4 шага с крупными номерами.
6. CTA-баннер (середина) — контрастный градиентный фон, заголовок, кнопка.
7. Прайс — 3 плана, средний выделен (scale(1.05), акцентная рамка, бейдж «ХИТ», контрастная кнопка).
8. 2-3 отзыва — аватар (CSS-кружок с инициалами и градиентом или loremflickr portrait,face) + имя + должность + 5 звёзд + измеримый результат.
9. FAQ — нативный <details>-аккордеон на 4-6 реальных вопросов с развёрнутыми ответами.
10. Финальный CTA-баннер перед футером — крупный заголовок, кнопка + подпись-снятие-риска.
11. Футер 4 колонки (бренд+описание / Услуги / Компания / Контакты) + строка соцсетей (инлайн-SVG в кружках) + тонкий верхний бордер.
Контент: НИКОГДА «Заголовок», «Услуга 1», «Lorem ipsum» — только конкретные продающие тексты с обещанием результата. Цифры везде (метрики, суммы, «+40% заявок за 2 месяца»). Над каждым h2 — капс-лейбл акцентом. Два CTA-баннера обязательны.
```css
.eyebrow{display:inline-block;font-size:.75rem;font-weight:700;letter-spacing:.12em;color:var(--accent);text-transform:uppercase;margin-bottom:1rem}
.stat b{display:block;font-size:2.5rem;font-weight:800;line-height:1;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.plan.featured{border:2px solid var(--accent);transform:scale(1.05);box-shadow:var(--shadow-lg)}
.badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:.7rem;font-weight:700;letter-spacing:.1em;padding:.35rem 1rem;border-radius:999px}
.faq details{border:1px solid var(--line);border-radius:14px;padding:0 1.5rem;margin-bottom:1rem;background:var(--surface)}
.faq summary{list-style:none;cursor:pointer;font-weight:600;padding:1.25rem 0;display:flex;justify-content:space-between;align-items:center}
.faq summary::-webkit-details-marker{display:none}
.stars{color:#f5a623;letter-spacing:2px;margin-bottom:1rem}
.avatar{width:48px;height:48px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:700;color:#fff;background:var(--grad)}
.cta-banner{text-align:center;padding:4rem 2rem;border-radius:var(--r-xl);background:var(--grad);color:#fff}
```
Счётчик метрик hero: <b class="count" data-to="250" data-suffix="+">0</b>. FAQ: нативный <details open><summary>Вопрос<span class="chev"></span></summary><p>Ответ.</p></details>.

## 5. Интерактив и анимации
- Reveal при скролле ОБЯЗАТЕЛЕН — через нативный IntersectionObserver, со stagger по индексу. Уважай prefers-reduced-motion.
- Sticky-хедер с blur, при скролле класс .scrolled (тень + меньше паддинг) через scroll + requestAnimationFrame-флаг.
- Метрики — считай счётчиком через requestAnimationFrame при попадании в вьюпорт.
- Анимируй только transform и opacity (не width/top/left). Ничего не должно дёргаться/мигать при загрузке.
```html
<style>
.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
.reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}}
.header{position:sticky;top:0;z-index:50;transition:padding var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}
.header.scrolled{box-shadow:var(--shadow-md)}
</style>
<script>
addEventListener('DOMContentLoaded',()=>{
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{
    if(e.isIntersecting){e.target.style.transitionDelay=(e.target.dataset.delay||0)+'ms';e.target.classList.add('in');io.unobserve(e.target)}});},{threshold:.15});
  document.querySelectorAll('.reveal').forEach((el,i)=>{el.dataset.delay=(i%6)*90;io.observe(el)});
  const anim=el=>{const to=+el.dataset.to,suf=el.dataset.suffix||'',t0=performance.now();
    const tick=n=>{const p=Math.min((n-t0)/1400,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e)+suf;if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};
  const co=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){anim(e.target);co.unobserve(e.target)}});},{threshold:.6});
  document.querySelectorAll('.count').forEach(el=>co.observe(el));
  let t=false;addEventListener('scroll',()=>{if(!t){requestAnimationFrame(()=>{document.querySelector('.header')?.classList.toggle('scrolled',scrollY>20);t=false});t=true}},{passive:true});
});
</script>
```
КЛЮЧЕВОЙ ПРИНЦИП: дорого = тёмный тонированный фон + один hue во всём + многослойные тени + свечения-градиенты + стеклянные поверхности со светящимся бордером + инлайн-SVG логотип и иконки в плашках + крупная типографика + щедрая пустота + ПОЛНЫЙ лендинг 9-11 секций с цифрами, выделенным тарифом, нативным FAQ, отзывами и двумя CTA + плавные анимации и счётчики. По умолчанию собирай именно так.
═══════════════════════════════════════════════════════════════════════════

8. ПОЛНОТА И КРАСОТА ВМЕСТЕ: по умолчанию собирай ПОЛНЫЙ премиум-лендинг из 9-11 секций (см. блок ПРЕМИУМ-ДИЗАЙН, раздел «Богатый контент»). Заготовка из hero + 3 карточек — брак. Пиши CSS сжато и переиспользуй классы/CSS-переменные (без дублей), чтобы места хватило и на богатый контент, и на полное завершение документа. Если объёма реально не хватает — убери ОДНУ второстепенную секцию, но каждую оставшуюся доведи до премиум-качества и ОБЯЗАТЕЛЬНО закончи документ на </body></html>.
9. ЦЕЛОСТНОСТЬ И ПОЛНОТА: документ ОБЯЗАТЕЛЬНО заканчивается на </body></html> и НИКОГДА не обрывается на середине тега/CSS. Бюджет токенов большой — места хватает на ПОЛНЫЙ сайт, поэтому НЕ экономь на секциях и НЕ останавливайся раньше времени. КРИТИЧНО: доведи до конца ВСЕ секции из своего плана RW:plan и весь обязательный скелет из блока ПРЕМИУМ-ДИЗАЙН (раздел 4). Если чувствуешь, что объёма мало — пиши CSS компактнее и переиспользуй классы, но секции НЕ выбрасывай. Закрыть </html> без меню/услуг с ценами, без тарифов, без отзывов, без FAQ (<details>) или без футера — это БРАК, так делать НЕЛЬЗЯ.
9a. САМОПРОВЕРКА перед выдачей (мысленно пройди чек-лист): собрано ли ≥9 секций и ВСЕ из плана RW:plan? есть ли обязательные меню/услуги с ценами, тарифы (3 плана, средний выделен), отзывы, FAQ-аккордеон <details> и футер из 4 колонок? иконки — инлайн-SVG в плашках (не эмодзи)? логотип — SVG-значок + название? кнопки премиум (градиент+свечение)? весь текст читается на своём фоне, отступы с «воздухом», hero цепляет, текст продающий без «воды»? все теги закрыты и есть </body></html>? Если чего-то из этого НЕТ — дособери ПЕРЕД выдачей, не сдавай неполный сайт.
9aa. ПЛАН В НАЧАЛЕ (для интерактивного чата — ОБЯЗАТЕЛЬНО): САМОЙ ПЕРВОЙ строкой ответа, ДО <!DOCTYPE html>, выведи РОВНО ОДИН маркер плана строго в формате <!--RW:plan:краткий план--> — одно живое предложение от первого лица: что за сайт делаешь и из каких секций он будет состоять (пример: <!--RW:plan:Делаю тёплый лендинг пекарни: hero с витриной, преимущества, каталог тортов с ценами, отзывы и форму заказа-->). При ПРАВКЕ — что и как собираешься изменить (пример: <!--RW:plan:Меняю палитру на тёмную и добавляю блок отзывов-->). Это невидимый комментарий, он не влияет на сайт. Ровно один такой маркер и сразу после него — <!DOCTYPE html>.
9b. ЖИВЫЕ МАРКЕРЫ ПРОГРЕССА (для интерактивного чата — ОБЯЗАТЕЛЬНО): по ходу вёрстки вставляй служебные HTML-комментарии СТРОГО в формате <!--RW:step:...--> — они невидимы и НЕ влияют на сайт, но в реальном времени ПОДРОБНО показывают пользователю ход работы. Пиши от первого лица, живо и КОНКРЕТНО, с деталями (что за элемент, какая палитра/шрифт/фишка), 4-9 слов, каждый маркер РАЗНЫЙ. Расставляй так:
   • в начале <head> — маркер про выбранную палитру и шрифты, например <!--RW:step:Задаю тёплую палитру #6F4E37 / #F5E6D3 и шрифты Playfair + Inter-->;
   • ПЕРЕД КАЖДОЙ крупной секцией <body> — с конкретикой, что именно в ней, например <!--RW:step:Собираю hero с крупным оффером и кнопкой записи-->, <!--RW:step:Верстаю каталог из 6 карточек с фото и ценами-->, <!--RW:step:Добавляю блок отзывов со звёздами для доверия-->, <!--RW:step:Делаю форму заявки с валидацией и контактами-->;
   • в конце — маркер про финальные штрихи, например <!--RW:step:Настраиваю адаптив под телефоны и плавные анимации при скролле-->.
Всего 6-10 РАЗНЫХ подробных маркеров. При ПРАВКЕ — маркеры о том, что именно меняешь, например <!--RW:step:Меняю цвет кнопок на синий #2563EB-->. Не злоупотребляй — только про реальную работу.

ОБЯЗАТЕЛЬНОЕ SEO-оформление <head> (важно для индексации в Яндекс и Google):
10. <html lang="ru"> (или другой язык, если пользователь просит сайт на другом языке)
11. <title> — конкретный, отражающий суть бизнеса/сайта (40-60 символов), без "Roboweb" и общих слов вроде "Главная"
12. <meta name="description" content="..."> — продающее описание сути сайта (120-160 символов), без воды
13. <meta name="viewport" content="width=device-width, initial-scale=1.0">
14. <meta charset="UTF-8">
15. <meta property="og:title">, <meta property="og:description">, <meta property="og:type" content="website"> — синхронизированы с title/description
16. Если на сайте есть подходящее изображение (логотип, hero-картинка) — добавь <meta property="og:image" content="...">
17. Один <h1> на странице, отражающий главный оффер, остальные заголовки — <h2>/<h3> по иерархии

ПОРЯДОК ОТВЕТА — СТРОГО СОБЛЮДАЙ (это критично для работоспособности превью):
1) СНАЧАЛА — полный HTML-документ, начиная с <!DOCTYPE html> и заканчивая </body></html>. Это ГЛАВНОЕ. HTML должен быть ЦЕЛЫМ и завершённым.
2) ТОЛЬКО ПОСЛЕ закрывающего </html> добавь на новой строке ОДНУ строку служебных метаданных строго в формате (валидный JSON в одну строку, экранируй кавычки):
<!--ROBOWEB_META:{"intro":"...","summary":"...","steps":["..."],"design":"...","sections":["..."],"suggestions":[{"icon":"Star","label":"...","prompt":"..."}]}-->
НИКОГДА не ставь блок метаданных ПЕРЕД HTML — только в самом конце. Если места мало — сократи метаданные, но HTML закончи полностью.
Заполни метаданные ЖИВО и УВЛЕКАТЕЛЬНО, от первого лица, как опытный разработчик, который с азартом рассказывает клиенту о работе. Пиши с эмоцией и деталями, но по делу (без воды):
- intro — 1-2 живых предложения: как ты понял задачу и с каким настроем взялся (пример: «Понял — нужен продающий лендинг для барбершопа, который цепляет с первого экрана. Сразу представил брутальный тёмный стиль — взялся за дело!»).
- summary — 2-3 предложения: что в итоге получилось, с гордостью за результат. ОБЯЗАТЕЛЬНО заверши summary КОНКРЕТНЫМ вопросом-предложением развить проект дальше, опираясь на то, чего на сайте СЕЙЧАС ещё НЕТ (посмотри, каких секций/функций не хватает именно этому сайту, и предложи их). Каждый раз предлагай РАЗНОЕ и уместное: например если нет отзывов — предложи отзывы; если нет цен — блок тарифов; если нет формы — форму заявки; если всё есть — предложи усилить дизайн/тексты/анимации. НЕ повторяй одну и ту же шаблонную фразу. Пример хорошего: «Заметил, что не хватает блока с ценами — добавим его, чтобы клиенты сразу видели стоимость?».
- steps — 5-8 пунктов ЖИВЫМ языком, каждый про конкретное действие с деталью и лёгкой эмоцией (примеры: «Собрал цепляющий hero с крупным оффером и кнопкой записи», «Подобрал тёплую палитру #6F4E37 под атмосферу кофейни», «Добавил секцию отзывов со звёздами — это повышает доверие», «Настроил плавные анимации появления блоков при скролле»). Для правок — что нашёл и что именно изменил.
- design — 1 живое предложение про дизайн-решение: палитра, шрифты, настроение (зачем именно так).
- sections — 3-6 коротких названий секций.
- suggestions — 3-4 УМЕСТНЫЕ именно для этого сайта идеи развития (что добавить дальше). Каждая: icon (Star, Phone, Calendar, MessageSquare, MapPin, ShoppingCart, Image, Users, Award, Mail, CreditCard, Clock), label (2-4 слова), prompt (готовая команда мне на выполнение).
3) ПОСЛЕ строки метаданных добавь на новой строке ЕЩЁ ОДИН служебный блок — ПОДРОБНЫЙ красивый отчёт о проделанной работе в Markdown, строго в формате (может быть многострочным):
<!--RW:report:<markdown-отчёт>-->
Это невидимый служебный блок (НЕ попадает на сайт), но именно он показывается пользователю в чате как красивое развёрнутое сообщение — сделай его отличным. Пиши как опытный разработчик, который по-человечески и с гордостью рассказывает клиенту, что сделал:
- развёрнуто и живо, от первого лица, 6-10 строк;
- используй Markdown: **жирным** выделяй ключевое, `инлайн-код` для цветов (#hex), названий шрифтов и технических деталей, маркированные списки «- » для перечислений;
- структура: 1-2 предложения вступления (что за сайт получился и его настроение) → строка «**Что внутри:**» и под ней маркированный список ключевых секций/фишек с конкретикой → отдельная строка «**Дизайн.**» про палитру (`#hex`) и шрифты (`Название`) → заверши тёплым вопросом-предложением развить проект дальше;
- эмодзи уместны, но без перебора.
ИТОГОВЫЙ ПОРЯДОК ОТВЕТА: HTML-документ → строка ROBOWEB_META → блок RW:report. Внутри RW:report Markdown ПРИВЕТСТВУЕТСЯ, в самом HTML — никакого markdown.

⚠️ ОБЯЗАТЕЛЬНЫЙ ФИНАЛ КАЖДОГО САЙТА — НЕ ОБРЫВАЙ РАНЬШЕ (частая ошибка: сайт заканчивают на отзывах). Ты НЕ имеешь права закрыть </body>, пока НЕ добавил, строго в этом порядке, ПОСЛЕДНИЕ обязательные блоки:
  1) секцию тарифов/цен (3 плана, средний выделен бейджем «ХИТ»), если её ещё нет;
  2) секцию отзывов (2-3 карточки с аватаром, именем, 5 звёздами);
  3) FAQ — <section class="faq"> с нативным <details>-аккордеоном на 4-6 реальных вопросов с развёрнутыми ответами;
  4) финальный CTA-баннер на градиенте;
  5) <footer> из 4 колонок: бренд+описание, навигация по разделам, услуги/ссылки, контакты (адрес, телефон, email, режим работы) + строка соцсетей инлайн-SVG в кружках + нижняя строка с © и годом.
Только ПОСЛЕ полноценного <footer> идёт </body></html>. Сайт без FAQ и без футера с контактами — НЕДОДЕЛАННЫЙ, это брак. Места в бюджете достаточно — доводи до конца, не «сворачивайся» преждевременно."""

def get_project_images(project_id, user_id: int, schema: str):
    """Возвращает список изображений, загруженных пользователем в хранилище проекта (раздел Ядро)."""
    if not project_id:
        return []
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT file_name, file_url FROM {schema}.site_files
                    WHERE project_id = %s AND user_id = %s AND file_type = 'image'
                    ORDER BY created_at DESC LIMIT 20""",
                (int(project_id), user_id)
            )
            return [{'name': r[0], 'url': r[1]} for r in cur.fetchall()]
    finally:
        conn.close()

def build_system_prompt(project_images: list) -> str:
    if not project_images:
        return SYSTEM_PROMPT
    images_list = '\n'.join(f'- {img["name"]}: {img["url"]}' for img in project_images)
    return SYSTEM_PROMPT + f"""

В хранилище проекта уже загружены следующие изображения пользователя:
{images_list}

Если пользователь просит использовать своё изображение, логотип или фото — вставляй в <img src="..."> ТОЧНУЮ ссылку из списка выше, ничего не выдумывай. Если подходящего изображения в списке нет — используй только надёжные источники из правила 6a (picsum.photos с seed, placehold.co) или CSS-градиент. НИКОГДА не придумывай URL картинок."""

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }

def ok(data): return {'statusCode': 200, 'headers': cors(), 'body': data}
def err(msg, code=400): return {'statusCode': code, 'headers': cors(), 'body': {'error': msg}}

def get_user_id(session_id: str, schema: str):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
                (session_id,)
            )
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()

PLAN_LIMITS = {
    'free': 10, 'premium': 40,
    'pro_60': 60, 'pro_80': 80, 'pro_200': 200, 'pro_400': 400, 'pro_800': 800,
}

def check_and_consume_quota(user_id: int, schema: str, cost: int = 1):
    """Проверяет лимит AI-запросов (тариф + энергия) и списывает `cost` единиц.
    cost=1 — обычная генерация, cost=3 — усиленная (крупная задача, детальный сайт).
    Списание идёт сначала из лимита тарифа, затем из энергии (может частично из обоих).
    Возвращает (allowed: bool, error_message: str|None, remaining: int)"""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT plan, requests_used, requests_limit, requests_reset_at, energy_balance
                    FROM {schema}.users WHERE id = %s FOR UPDATE""",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return False, 'Пользователь не найден', 0
            plan, used, limit, reset_at, energy = row

            from datetime import datetime, timezone
            if reset_at and reset_at <= datetime.now(timezone.utc):
                used = 0
                limit = PLAN_LIMITS.get(plan, limit)
                cur.execute(
                    f"""UPDATE {schema}.users
                        SET requests_used = 0, requests_limit = %s, requests_reset_at = NOW() + INTERVAL '30 days', low_balance_notified = false
                        WHERE id = %s""",
                    (limit, user_id)
                )

            # Всего доступно = остаток тарифа + энергия. Если крупной задачи не хватает —
            # не списываем ничего и просим пополнить (не оставляем пользователя без результата).
            available = (limit - used) + energy
            if available < cost:
                conn.commit()
                return False, 'Лимит AI-запросов исчерпан. Пополните энергию или смените тариф.', 0

            # Списываем cost: сначала из лимита тарифа, остаток — из энергии.
            from_limit = min(cost, max(0, limit - used))
            from_energy = cost - from_limit
            if from_limit:
                cur.execute(f"UPDATE {schema}.users SET requests_used = requests_used + %s WHERE id = %s", (from_limit, user_id))
            if from_energy:
                cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance - %s WHERE id = %s", (from_energy, user_id))
            conn.commit()
            return True, None, available - cost
    finally:
        conn.close()

def refund_quota(user_id: int, schema: str, cost: int = 1):
    """Возвращает списанные `cost` единиц, если обращение к AI не удалось (таймаут, ошибка модели).
    Пользователь не должен терять запросы из лимита, если сайт не был сгенерирован.
    Порядок восстановления зеркален списанию: сначала энергия, затем лимит тарифа."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT requests_used FROM {schema}.users WHERE id = %s FOR UPDATE",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return
            used = row[0]
            # Сначала возвращаем в энергию столько, сколько было списано сверх лимита,
            # остальное — обратно в лимит тарифа (не уводя used ниже нуля).
            to_limit = min(cost, used)
            to_energy = cost - to_limit
            if to_limit:
                cur.execute(f"UPDATE {schema}.users SET requests_used = requests_used - %s WHERE id = %s", (to_limit, user_id))
            if to_energy:
                cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance + %s WHERE id = %s", (to_energy, user_id))
            conn.commit()
    except Exception:
        pass
    finally:
        conn.close()

def send_low_balance_email(to_email: str, remaining: int):
    """Отправляет предупреждение о заканчивающихся AI-запросах."""
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not smtp_password or not to_email:
        return

    smtp_user = 'roboweb.site@yandex.ru'
    is_zero = remaining <= 0

    msg = MIMEMultipart('alternative')
    msg['Subject'] = '🚫 Лимит AI-запросов исчерпан' if is_zero else f'⚡ Осталось {remaining} запросов к AI'
    msg['From'] = smtp_user
    msg['To'] = to_email

    text = (
        'Лимит AI-запросов на вашем аккаунте исчерпан.'
        if is_zero else
        f'На вашем аккаунте осталось {remaining} запросов к AI.'
    )

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
      <h2 style="color: #3b4cff; margin: 0 0 16px;">{'Лимит запросов исчерпан' if is_zero else 'Запросы заканчиваются'}</h2>
      <p style="color: #444; font-size: 16px; margin: 0 0 16px;">{text}</p>
      <p style="color: #666; font-size: 14px; margin: 0 0 20px;">Пополните энергию или смените тариф, чтобы продолжить создавать сайты с AI.</p>
      <a href="https://roboweb.site/pricing" style="display:inline-block; background:#3b4cff; color:#fff; text-decoration:none; padding:10px 20px; border-radius:10px; font-weight:600;">Перейти к тарифам</a>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">Письмо отправлено автоматически с сайта Roboweb</p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    try:
        # timeout обязателен: без него зависшее SMTP-соединение могло съедать до 20-30 сек
        # из общего бюджета функции ЕЩЁ ДО обращения к AI — это была скрытая причина части
        # таймаутов "Генерация заняла слишком много времени", не связанная с самой моделью.
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465, timeout=5) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    except Exception:
        pass


def maybe_notify_low_balance(user_id: int, remaining: int, schema: str):
    """Если баланс низкий и уведомление ещё не отправлялось в этом цикле — шлём письмо и ставим флаг.
    Если баланс восстановился выше порога — сбрасываем флаг, чтобы уведомить снова в следующий раз."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT email, low_balance_notified FROM {schema}.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return
            email, already_notified = row

            if remaining <= LOW_BALANCE_THRESHOLD:
                if not already_notified:
                    send_low_balance_email(email, remaining)
                    cur.execute(f"UPDATE {schema}.users SET low_balance_notified = true WHERE id = %s", (user_id,))
                    conn.commit()
            elif already_notified:
                cur.execute(f"UPDATE {schema}.users SET low_balance_notified = false WHERE id = %s", (user_id,))
                conn.commit()
    finally:
        conn.close()


def strip_progress_markers(html: str) -> str:
    """Убирает служебные маркеры живого прогресса <!--RW:plan:...--> и <!--RW:step:...--> из
    ФИНАЛЬНОГО HTML. В SSE-потоке они нужны фронтенду (план в начале + шаги по ходу), но в
    сохранённом/готовом/экспортируемом документе их быть не должно."""
    import re
    return re.sub(r'<!--\s*RW:[a-z]+:.*?-->\s*', '', html, flags=re.DOTALL)


def count_major_blocks(html: str) -> int:
    """Число крупных блоков сайта (секции + footer) — для проверки, что правка их не потеряла."""
    import re
    return len(re.findall(r'<section\b', html, re.IGNORECASE)) + len(re.findall(r'<footer\b', html, re.IGNORECASE))


def is_removal_request(text: str) -> bool:
    """Просил ли пользователь что-то УБРАТЬ/удалить/заменить (тогда уменьшение числа блоков — норма)."""
    t = (text or '').lower()
    return any(w in t for w in ('убер', 'удал', 'сотри', 'убира', 'remove', 'delete', 'замен', 'replace', 'вместо'))


def extract_report_block(text: str):
    """Извлекает подробный markdown-отчёт из служебного блока <!--RW:report:...-->.
    Возвращает (text_без_блока, report_markdown). Блок может быть многострочным.
    Если ответ оборвался по лимиту токенов и закрывающего --> нет — берём отчёт до конца
    (частичный отчёт лучше, чем пустой fallback)."""
    import re
    m = re.search(r'<!--\s*RW:report:(.*?)-->', text, re.DOTALL)
    if m:
        return (text[:m.start()] + text[m.end():]), m.group(1).strip()[:4000]
    # Оборванный блок без закрывающего --> (усечён на конце ответа)
    m2 = re.search(r'<!--\s*RW:report:(.*)$', text, re.DOTALL)
    if m2:
        return text[:m2.start()], m2.group(1).strip()[:4000]
    return text, ''


def extract_meta_block(html: str):
    """Извлекает служебный блок <!--ROBOWEB_META:{...}--> с описанием и предложениями улучшений.
    Возвращает (html_без_блока, dict_метаданных). Если блока нет или он битый — вернёт пустой dict."""
    import re
    meta = {}
    # Ищем комментарий и берём его содержимое нежадно ДО "-->" (а не до первой }).
    # Затем внутри вырезаем JSON от первой { до последней } — так корректно ловим
    # вложенные объекты suggestions, не обрываясь на их закрывающих скобках.
    m = re.search(r'<!--\s*ROBOWEB_META:(.*?)-->', html, re.DOTALL)
    if m:
        raw = m.group(1).strip()
        start = raw.find('{')
        end = raw.rfind('}')
        json_str = raw[start:end + 1] if start != -1 and end != -1 else ''
        try:
            parsed = json.loads(json_str)
            if isinstance(parsed, dict):
                meta = {
                    'intro': str(parsed.get('intro', ''))[:300],
                    'summary': str(parsed.get('summary', ''))[:600],
                    'steps': [str(s)[:200] for s in (parsed.get('steps') or []) if str(s).strip()][:8],
                    'design': str(parsed.get('design', ''))[:300],
                    'sections': [str(s)[:60] for s in (parsed.get('sections') or [])][:6],
                    'suggestions': [
                        {
                            'icon': str(s.get('icon', 'Sparkles'))[:30],
                            'label': str(s.get('label', ''))[:40],
                            'prompt': str(s.get('prompt', ''))[:300],
                        }
                        for s in (parsed.get('suggestions') or [])
                        if isinstance(s, dict) and s.get('label') and s.get('prompt')
                    ][:4],
                }
        except (json.JSONDecodeError, Exception):
            meta = {}
        # Убираем блок из HTML в любом случае, чтобы он не отображался
        html = html[:m.start()] + html[m.end():]
    return html.strip(), meta


def build_meta_from_html(html: str, is_edit: bool) -> dict:
    """Резервное ПОДРОБНОЕ описание работы, когда модель не прислала служебный блок метаданных.
    Разбираем готовый HTML максимально детально и составляем «живой» пошаговый отчёт —
    как будто разработчик рассказывает по шагам всё, что он сделал."""
    import re
    low = html.lower()

    def clean(t):
        return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t)).strip()

    title_m = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    h1_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
    site_name = clean(title_m.group(1)) if title_m else (clean(h1_m.group(1)) if h1_m else '')

    # Секции — по заголовкам h2 (обычно это заголовки блоков сайта)
    h2s = [clean(x) for x in re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.IGNORECASE | re.DOTALL)]
    h2s = [h for h in h2s if h][:8]

    # --- Детальный разбор содержимого ---
    fonts = re.findall(r'family=([A-Za-z0-9+]+)', html)
    fonts = [f.replace('+', ' ') for f in dict.fromkeys(fonts)][:3]
    colors = re.findall(r'#[0-9a-fA-F]{6}', html)
    palette = list(dict.fromkeys([c.lower() for c in colors]))[:5]
    n_sections = len(re.findall(r'<section', low)) or len(h2s)
    n_images = len(re.findall(r'<img', low))
    n_buttons = len(re.findall(r'<button', low)) + len(re.findall(r'class="[^"]*btn', low))
    has_nav = '<nav' in low or '<header' in low
    has_footer = '<footer' in low
    has_form = '<form' in low or '<input' in low
    has_gradient = 'gradient(' in low
    has_anim = '@keyframes' in low or 'transition' in low or 'animation' in low
    has_hover = ':hover' in low
    has_shadow = 'box-shadow' in low or 'shadow' in low
    has_grid = 'display:grid' in low.replace(' ', '') or 'display: grid' in low or 'grid-template' in low
    has_flex = 'display:flex' in low.replace(' ', '') or 'display: flex' in low
    responsive = '@media' in low
    has_seo = 'name="description"' in low or 'og:title' in low

    if is_edit:
        intro = 'Понял задачу — вношу правку аккуратно, чтобы всё остальное осталось на месте. Приступаю!'
        steps = [
            'Открыл текущий код сайта и нашёл нужные элементы для изменения',
            'Аккуратно применил запрошенные правки, не задев остальную структуру',
            'Проверил, что вёрстка и стили остались целыми',
            'Обновил превью — результат уже виден справа',
        ]
        summary = ''  # осмысленный текст сформируем ниже — на основе того, чего сайту не хватает
        design = ''
    else:
        intro = f'Понял задачу — собираю сайт{(" «" + site_name + "»") if site_name else ""} с нуля. Уже вижу, каким он будет — взялся за дело!'
        steps = []
        # Структура
        if has_nav:
            steps.append('Сверстал шапку с навигацией по разделам')
        if h2s:
            steps.append('Спроектировал структуру из ' + str(n_sections) + ' секций: ' + ', '.join(h2s[:6]))
        else:
            steps.append('Спроектировал структуру страницы: hero-блок, основной контент и подвал')
        # Дизайн-детали
        if palette:
            steps.append('Подобрал цветовую палитру: ' + ', '.join(palette))
        if has_gradient:
            steps.append('Добавил современные градиенты для акцентов и фонов')
        if fonts:
            steps.append('Подключил шрифты Google Fonts: ' + ', '.join(fonts))
        if has_grid or has_flex:
            steps.append('Настроил гибкую сетку (Grid/Flexbox) для аккуратного расположения блоков')
        if has_shadow:
            steps.append('Оформил карточки с тенями и скруглениями для «объёмного» вида')
        # Контент
        if n_images:
            steps.append(f'Разместил изображения и визуальные акценты ({n_images} шт.)')
        if n_buttons:
            steps.append('Добавил призывы к действию (кнопки) для конверсии')
        if has_form:
            steps.append('Встроил форму для заявок/обратной связи')
        # Интерактив
        if has_anim:
            steps.append('Добавил плавные анимации появления блоков при прокрутке')
        if has_hover:
            steps.append('Настроил интерактивные hover-эффекты на кнопках и карточках')
        # Технические плюсы
        if responsive:
            steps.append('Сделал вёрстку адаптивной — сайт корректно смотрится на телефоне и десктопе')
        if has_seo:
            steps.append('Прописал SEO-теги (title, description, Open Graph) для индексации в поиске')
        if has_footer:
            steps.append('Добавил подвал с контактами и служебной информацией')

        # design-строка
        design_bits = []
        if palette:
            design_bits.append('палитра ' + ', '.join(palette[:3]))
        if fonts:
            design_bits.append('шрифты ' + ', '.join(fonts[:2]))
        design = ('Дизайн: ' + '; '.join(design_bits) + '.') if design_bits else ''

        summary = 'Готово! Собрал ' + ('насыщенный ' if n_sections >= 5 else '') + 'современный сайт — он уже открыт в превью справа.'

    # Резервные идеи развития — анализируем ГОТОВЫЙ HTML и предлагаем только то, чего в нём
    # ещё НЕТ. Работает и для создания, и для правок: после каждой правки список подстраивается
    # под актуальное состояние сайта (уже добавленное больше не предлагается).
    section_text = ' '.join(h2s).lower() + ' ' + low
    candidates = [
        (not has_form, {'icon': 'Mail', 'label': 'Форма заявки', 'prompt': 'Добавь форму заявки с полями имя, телефон и кнопкой отправки'}),
        (not any(w in section_text for w in ('отзыв', 'review', 'testimonial')), {'icon': 'Star', 'label': 'Блок отзывов', 'prompt': 'Добавь секцию с отзывами клиентов и звёздным рейтингом'}),
        (not any(w in section_text for w in ('цен', 'тариф', 'price', 'pricing', 'план')), {'icon': 'CreditCard', 'label': 'Цены/тарифы', 'prompt': 'Добавь блок с ценами или тарифами в виде карточек'}),
        (not any(w in section_text for w in ('faq', 'вопрос', 'question')), {'icon': 'MessageSquare', 'label': 'Раздел FAQ', 'prompt': 'Добавь раздел с частыми вопросами и ответами (FAQ)'}),
        (n_images == 0, {'icon': 'Image', 'label': 'Галерея фото', 'prompt': 'Добавь красивую галерею изображений в виде сетки'}),
        (not any(w in section_text for w in ('карт', 'map', 'адрес', 'контакт', 'contact')), {'icon': 'MapPin', 'label': 'Карта и адрес', 'prompt': 'Добавь блок с адресом, картой и контактами'}),
        (not any(w in section_text for w in ('преимущ', 'benefit', 'почему', 'feature')), {'icon': 'Award', 'label': 'Преимущества', 'prompt': 'Добавь блок с ключевыми преимуществами (4-6 пунктов с иконками)'}),
        (not any(w in section_text for w in ('команд', 'team', 'о нас', 'about')), {'icon': 'Users', 'label': 'О команде', 'prompt': 'Добавь секцию «О нас» с рассказом о команде'}),
    ]
    suggestions = [item for cond, item in candidates if cond][:4]

    # ДИНАМИЧЕСКИЙ ВОПРОС-ПРЕДЛОЖЕНИЕ: формируем осмысленное предложение развития именно
    # из того, чего сайту НЕ ХВАТАЕТ (первые 2 недостающих элемента). Так вопрос каждый раз
    # разный и ведёт проект вперёд, а не повторяет одну шаблонную фразу.
    import random as _random
    missing = [item['label'] for cond, item in candidates if cond]
    if missing:
        picks = missing[:3]
        _random.shuffle(picks)
        offer_list = ', '.join(picks[:2]).lower()
        openers = [
            f'Что дальше — добавим {offer_list}?',
            f'Могу усилить проект: {offer_list}. С чего начнём?',
            f'Хотите докрутим? Например, {offer_list} — заметно поднимут сайт.',
            f'Двигаемся дальше — предлагаю {offer_list}. Делаем?',
        ]
        tail = ' ' + _random.choice(openers) + ' 🚀'
    else:
        # На сайте уже почти всё есть — предлагаем полировку.
        polish = ['усилить дизайн и анимации', 'сделать тексты ещё продающее', 'улучшить адаптивность под телефоны', 'добавить SEO-описания']
        _random.shuffle(polish)
        tail = f' Что улучшим дальше — {polish[0]} или {polish[1]}? 🚀'

    summary = (summary or 'Готово!').rstrip() + tail

    return {
        'intro': intro[:300],
        'summary': summary[:600],
        'steps': [s[:200] for s in steps][:12],
        'design': design[:300],
        'sections': h2s[:6],
        'suggestions': suggestions,
    }


def repair_truncated_html(html: str) -> str:
    """Если сгенерированный HTML оборвался (модель упёрлась в лимит токенов) — закрываем
    незавершённые ключевые теги, чтобы браузер смог отрендерить хотя бы часть сайта,
    а не показывал пустой белый экран. Если документ целый — возвращаем как есть."""
    low = html.lower()
    # Документ уже завершён корректно
    if low.rstrip().endswith('</html>'):
        return html

    # Обрыв внутри <style> (частый случай — превью полностью белое): закрываем стиль,
    # добавляем тело с уведомлением, чтобы страница не была пустой.
    if '<style' in low and '</style>' not in low:
        html += '\n</style>'
        low = html.lower()

    if '<head' in low and '</head>' not in low:
        html += '\n</head>'
        low = html.lower()

    # Если тело так и не началось — добавим минимальное, чтобы не было белого экрана
    if '<body' not in low:
        html += '\n<body></body>'
        low = html.lower()
    elif '</body>' not in low:
        html += '\n</body>'
        low = html.lower()

    if '</html>' not in low:
        html += '\n</html>'

    return html


def extract_meta_description(html: str) -> str:
    """Достаёт человекочитаемое описание сайта: сперва meta description, потом title, иначе — обрезок текста без тегов."""
    import re
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if m and m.group(1).strip():
        return m.group(1).strip()[:300]
    t = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if t and t.group(1).strip():
        return t.group(1).strip()[:300]
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:300]

def save_html(project_id: int, html: str, schema: str):
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {schema}.projects SET html_content = %s, description = %s, updated_at = NOW() WHERE id = %s",
                (html, extract_meta_description(html), project_id)
            )
        conn.commit()
    finally:
        conn.close()


# Ключевые слова, по которым запрос считаем "крупной задачей" — тогда включается
# усиленная генерация (детальнее сайт, больше секций) и списывается больше энергии.
LARGE_TASK_KEYWORDS = [
    # ru
    'магазин', 'интернет-магазин', 'каталог', 'корзин', 'маркетплейс', 'лендинг',
    'многостранич', 'портфолио', 'галере', 'прайс', 'тариф', 'отзыв', 'блог', 'faq',
    'форма заявк', 'форма обратн', 'калькулятор', 'дашборд', 'админ', 'личный кабинет',
    'много секц', 'подробн', 'детальн', 'большой сайт', 'крупный', 'полноценн',
    'разделы', 'меню навигац', 'слайдер', 'карусел', 'анимаци', 'корпоратив',
    # en
    'shop', 'store', 'ecommerce', 'catalog', 'cart', 'marketplace', 'landing',
    'multipage', 'portfolio', 'gallery', 'pricing', 'testimonial', 'blog', 'dashboard',
    'sections', 'detailed', 'full site', 'corporate', 'slider', 'carousel',
]


def detect_large_task(text: str, is_edit: bool) -> bool:
    """Определяет, является ли запрос крупной задачей — по ключевым словам и объёму текста.
    Правки существующего сайта крупными не считаем: там меняется малая часть кода."""
    if is_edit:
        return False
    low = (text or '').lower()
    keyword_hits = sum(1 for kw in LARGE_TASK_KEYWORDS if kw in low)
    # Крупная задача, если: есть 2+ характерных слова ИЛИ одно сильное слово + длинное подробное ТЗ.
    return keyword_hits >= 2 or (keyword_hits >= 1 and len(low) >= 220)


# Готовые стили-пресеты: пользователь выбирает эстетику, и ИИ точно в неё попадает.
STYLE_PRESETS = {
    'minimal': "СТИЛЬ — МИНИМАЛИЗМ: чистый светлый дизайн, много воздуха, тонкая типографика, "
               "спокойная почти монохромная палитра с одним сдержанным акцентом, тонкие линии-разделители, "
               "лёгкие тени, никаких лишних украшений. Элегантно и просто.",
    'premium': "СТИЛЬ — ПРЕМИУМ: дорогой элегантный вид, тёмная или глубокая палитра с золотым/бронзовым или "
               "благородным акцентом, засечные или контрастные шрифты, крупные заголовки, много «воздуха», "
               "тонкие рамки и деликатные градиенты. Ощущение люкса и статуса.",
    'bright': "СТИЛЬ — ЯРКИЙ: сочная жизнерадостная палитра (2-3 контрастных цвета), крупные насыщенные градиенты, "
              "энергичные кнопки, скруглённые формы, эмодзи/иконки, динамичные акценты. Молодо, свежо и позитивно.",
    'dark': "СТИЛЬ — ТЁМНЫЙ: тёмный фон (near-black/тёмно-серый), неоновый или яркий акцентный цвет, "
            "свечения (glow) и градиентные пятна, контрастная светлая типографика, эффект «технологичности». "
            "Современно, брутально и стильно.",
}


def handler(event: dict, context) -> dict:
    """Генерирует HTML-код сайта по описанию пользователя. Claude Sonnet 5 идёт напрямую через
    Anthropic API (если настроен ANTHROPIC_API_KEY), остальные модели — через OpenRouter.
    Обёртка с try/except: любое неожиданное исключение (баг, сбой БД и т.п.) логируется ПОЛНОСТЬЮ
    с traceback и превращается в понятный ответ 500, а не в "тихий" сбой платформы без деталей —
    это критично для диагностики (иначе причина ошибки остаётся неизвестной)."""
    try:
        return _handler_impl(event, context)
    except Exception as e:
        import traceback
        log(f'UNHANDLED EXCEPTION in generate-site: {repr(e)}\n{traceback.format_exc()}')
        return err('Внутренняя ошибка сервиса. Мы уже знаем о проблеме — попробуйте через минуту.', 500)


def _handler_impl(event: dict, context) -> dict:
    import time as _time
    started_at = _time.monotonic()

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    session_id = headers.get('x-session-id', '')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not session_id:
        return err('Не авторизован', 401)

    user_id = get_user_id(session_id, schema)
    if not user_id:
        return err('Сессия истекла', 401)

    body = json.loads(event.get('body') or '{}')
    messages = body.get('messages', [])
    project_id = body.get('project_id')
    current_html = body.get('current_html', '')
    style_choice = body.get('style', '')  # выбранный стиль-пресет (minimal/premium/bright/dark)
    stream_mode = bool(body.get('stream'))  # true → отдаём генерацию потоком (SSE, лайв-сборка)

    if not messages:
        return err('Нет сообщений')

    # Стоимость запроса ДО списания:
    #  - обычный: 1 единица
    #  - крупная задача (магазин, лендинг с множеством секций): 3 единицы
    is_edit = bool(current_html)
    last_user_text = (messages[-1].get('content', '') or '') if messages else ''
    is_large_task = detect_large_task(last_user_text, is_edit)
    request_cost = 3 if is_large_task else 1

    allowed, quota_error, remaining = check_and_consume_quota(user_id, schema, request_cost)
    if not allowed:
        maybe_notify_low_balance(user_id, 0, schema)
        return err(quota_error, 402)

    # ВАЖНО: уведомление о низком балансе отправляем ПОСЛЕ успешной генерации, а не до неё.
    # Раньше вызов стоял здесь и мог задерживать сам процесс генерации из-за медленного SMTP —
    # это съедало секунды из общего бюджета времени функции ещё до обращения к AI.

    project_images = get_project_images(project_id, user_id, schema)
    system_prompt = build_system_prompt(project_images)

    # Таймаут облачной функции поднят до 90 сек (было ~30) — все внутренние лимиты ниже
    # пересчитаны с запасом под этот бюджет времени, а не впритык к нему.

    # Обрезаем последнюю команду пользователя на случай, если вставлен огромный текст/код
    MAX_MESSAGE_CHARS = 12000
    last_user_content = (messages[-1].get('content', '') or '')[:MAX_MESSAGE_CHARS]

    # КЛЮЧЕВОЙ МОМЕНТ: если сайт уже сгенерирован ранее — это ПРАВКА существующего кода.
    # Передаём модели текущий HTML напрямую + только новую команду, вместо всей истории чата.
    # Это одинаково важно для всех моделей (Claude/GPT-4o/Gemini):
    #   1) Модель видит реальный текущий код и точно знает, что менять — правки не "теряются"
    #      и не переписывают весь сайт заново по догадке
    #   2) Запрос остаётся компактным независимо от длины переписки — не растёт с каждой правкой,
    #      что радикально снижает время ответа и риск таймаута на длинных диалогах
    MAX_HTML_CHARS = 90000
    if current_html:
        html_for_prompt = current_html[:MAX_HTML_CHARS]
        edit_instruction = f"""Вот текущий HTML-код сайта:
```html
{html_for_prompt}
```

Задача пользователя: {last_user_content}

ПРАВИЛА ПРАВКИ (строго):
1. Внеси ТОЛЬКО запрошенное изменение. Всё остальное содержимое, ВСЕ существующие секции и блоки, стили и скрипты — СОХРАНИ ПОЛНОСТЬЮ, ничего не удаляй и не выкидывай.
2. КОЛИЧЕСТВО СЕКЦИЙ НЕ ДОЛЖНО УМЕНЬШИТЬСЯ (если тебя явно не просят что-то убрать): ОБЯЗАТЕЛЬНО верни ВСЕ те же <section>, шапку <header> и подвал <footer>, что были в исходном коде, в том же порядке — плюс твоё изменение. Особенно НЕ ЗАБУДЬ секцию контактов и <footer> в конце — их чаще всего случайно теряют.
3. СОХРАНИ якорную навигацию: id секций и ссылки меню (href="#...") должны остаться согласованными — если ссылка вела на #contact, секция с id="contact" ОБЯЗАНА остаться (не переименовывай id и не меняй href просто так), иначе меню перестанет работать.
4. Верни ПОЛНЫЙ обновлённый HTML-документ целиком от <!DOCTYPE html> до </body></html> (не фрагмент, не diff, без markdown).
5. КРИТИЧЕСКИ ВАЖНО: документ ОБЯЗАТЕЛЬНО должен быть завершён и заканчиваться на </body></html>. НИКОГДА не обрывай код на середине тега, стиля или блока — иначе сайт сломается и блоки пропадут. Если правка большая — всё равно уложись и заверши документ целиком."""
        chat_messages = [{'role': 'user', 'content': edit_instruction}]
    else:
        # Первая генерация — ограничиваем историю на случай, если пользователь уже писал
        # несколько сообщений до получения первого сайта (редкий случай, но подстрахуемся)
        MAX_HISTORY_MESSAGES = 16
        trimmed = messages if len(messages) <= MAX_HISTORY_MESSAGES else [messages[0]] + messages[-(MAX_HISTORY_MESSAGES - 1):]
        chat_messages = [
            {'role': m.get('role', 'user'), 'content': (m.get('content', '') or '')[:MAX_MESSAGE_CHARS]}
            for m in trimmed
        ]

    # Модель редактора выбирает пользователь в интерфейсе билдера:
    #  - 'sonnet' → Claude Sonnet 5 (по умолчанию: быстрее и дешевле, отличный баланс);
    #  - 'opus'   → Claude Opus 4.8 (мощнее для сложных/крупных сайтов).
    # Обе идут напрямую через Anthropic API (без посредников вроде OpenRouter).
    # Неизвестное/пустое значение → безопасный дефолт Sonnet 5.
    ANTHROPIC_MODELS = {
        'sonnet': 'claude-sonnet-5',
        'opus': 'claude-opus-4-8',
    }
    model_choice = str(body.get('model', '') or '').strip().lower()
    ANTHROPIC_MODEL = ANTHROPIC_MODELS.get(model_choice, 'claude-sonnet-5')
    anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not anthropic_api_key:
        return err('Anthropic API ключ не настроен')

    # Бюджет времени функции. По умолчанию платформа даёт 30 сек; если в настройках
    # (Ядро → Функции → generate-site) таймаут поднят вручную — задаём переменную окружения
    # FUNCTION_TIMEOUT_SEC (напр. 90), и код автоматически использует бОльший бюджет.
    # Это ключ к устранению ошибки 504: внутренний таймаут запроса к AI ВСЕГДА должен быть
    # меньше лимита функции, иначе платформа убивает функцию раньше, чем мы вернём ответ.
    function_timeout = int(os.environ.get('FUNCTION_TIMEOUT_SEC', '30'))

    # Sonnet 5 — мощная модель, физически НЕ укладывается в 30-секундный лимит функции: она
    # долго «рассуждает» и упирается в жёсткий таймаут платформы (504) раньше, чем мы успеваем
    # перехватить. Пока лимит функции не поднят, не даём генерировать впустую — сразу возвращаем
    # понятную подсказку и НЕ списываем запрос.
    if function_timeout <= 35:
        refund_quota(user_id, schema, request_cost)
        return err('Модель Sonnet 5 мощная и не успевает ответить за текущий таймаут функции. Поднимите таймаут generate-site до 90 секунд в настройках (Ядро → Функции).', 400)
    # Оставляем запас на чтение ответа, очистку HTML и запись в БД. Важно: наш внутренний
    # таймаут должен сработать ЗАМЕТНО раньше жёсткого лимита функции, иначе платформа убьёт
    # функцию с 504 до того, как мы вернём понятную ошибку. Поэтому запас ~12 сек.
    ai_timeout = max(12, function_timeout - 12)
    # Длину ответа масштабируем под РЕАЛЬНЫЙ бюджет времени. При 30-сек лимите функции модель
    # успевает сгенерировать ~4000 токенов до обрыва — ставим именно столько, чтобы документ
    # ГАРАНТИРОВАННО дописался целиком (лучше компактный целый сайт, чем длинный оборванный —
    # именно обрыв давал белый экран). При увеличенном лимите (90 сек) — можно больше.
    # ПРЕМИУМ ПО УМОЛЧАНИЮ: полноценный лендинг из 9-11 секций с инлайн-SVG и анимациями крупнее
    # прежней «компактной заготовки», поэтому в стрим-режиме (лайв-сборка редактора) даём щедрый
    # бюджет — сокет-таймаут там срабатывает НА КАЖДЫЙ чанк, а не на всю генерацию, так что длинный
    # премиум-сайт спокойно дописывается целиком, а пользователь видит прогресс живьём.
    max_tokens = 5000 if function_timeout <= 35 else 16000
    # Усиленная генерация (крупная задача): максимум места на детальный многосекционный сайт.
    if is_large_task:
        max_tokens = 6500 if function_timeout <= 35 else 22000

    # КРИТИЧНО ДЛЯ ПРАВОК: модель возвращает ВЕСЬ сайт целиком заново. Нужен баланс:
    #  - max_tokens должен вмещать весь текущий HTML + запас на изменения (иначе обрыв и потеря блоков),
    #  - но НЕ больше, чем модель реально успеет сгенерировать за бюджет времени (иначе таймаут 504).
    # Быстрые модели дают ~130-160 токенов/сек, значит за ai_timeout безопасно ~ai_timeout*140 токенов.
    if current_html:
        # Сколько токенов реально нужно, чтобы вернуть весь сайт. Для кириллицы 1 токен ≈ 2.7
        # символа (раньше делили на 3 и занижали → крупные правки обрывались). + 3500 на сами
        # изменения (правка часто ДОБАВЛЯЕТ целую секцию) + служебный блок ROBOWEB_META и
        # подробный отчёт RW:report, которые тоже идут в каждом ответе.
        needed = int(len(current_html) / 2.5) + 6000
        # Сколько модель реально успеет сгенерировать за отведённое время (быстрые модели легко
        # держат 200+ ток/сек на простом воспроизведении почти неизменного текста). В стрим-режиме
        # таймаут на чанк, поэтому потолок скорости не жмём — важен именно объём, чтобы премиум-сайт
        # (он крупнее прежних) вернулся целиком без потери секций.
        speed_ceiling = int(ai_timeout * 200) if not stream_mode else 10_000_000
        hard_ceiling = 12000 if function_timeout <= 35 else 32000
        ceiling = min(hard_ceiling, speed_ceiling)
        # Предварительно отклоняем ТОЛЬКО когда объём явно и заметно превышает возможности —
        # небольшое превышение не блокируем: если модель всё же не впишется, это надёжно
        # поймает пост-проверка was_truncated ниже (она не даст сохранить оборванный сайт).
        if needed > ceiling * 1.4:
            refund_quota(user_id, schema, request_cost)
            return err('Сайт уже большой — переписать его целиком за одну правку не получится, часть блоков могла бы потеряться. Сайт оставлен без изменений. Попросите точечное изменение (например: «измени цвет кнопок» или «поправь текст в блоке услуг») — такие правки применяются надёжно.', 413)
        # Даём модели ровно столько, сколько нужно на весь сайт, но не выше жёсткого потолка
        # платформы (hard_ceiling) — даже если это чуть больше «расчётной скорости» (speed_ceiling),
        # мы уже допустили это выше запасом ×1.4, так что не режем искусственно ниже потребности.
        max_tokens = min(needed, hard_ceiling)

    effective_system_prompt = system_prompt
    # Выбранный стиль-пресет — точная эстетика вместо угадывания.
    if style_choice in STYLE_PRESETS and not current_html:
        effective_system_prompt += "\n\n" + STYLE_PRESETS[style_choice]
    # Крупная задача: расширенный, максимально детальный сайт — контента должно быть БОЛЬШЕ, не меньше.
    if is_large_task:
        sections_hint = '9-11' if function_timeout > 35 else '7-9'
        effective_system_prompt += (
            f"\n\nЭто более крупная задача — собери РАСШИРЕННЫЙ премиум-сайт из {sections_hint} проработанных секций "
            "по полному скелету из блока ПРЕМИУМ-ДИЗАЙН (хедер, hero со счётчиками, полоса доверия, услуги/каталог с ценами, "
            "«как мы работаем», CTA-баннер, тарифы, отзывы, FAQ-аккордеон, финальный CTA, футер). "
            "Не экономь на секциях и контенте — доведи ВСЕ до конца. ОБЯЗАТЕЛЬНО заверши документ на </body></html>."
        )

    def call_anthropic(model_id: str, override_messages=None, override_max_tokens=None, override_timeout=None):
        """Прямой вызов Anthropic Messages API. Возвращает (result_dict | None, error_info).
        error_info = None при успехе, иначе (http_code, текст_причины). Ответ переводится в
        общий формат {'choices': [{'message': {'content': ...}}], 'usage': {...}}, которым
        пользуется весь код ниже (парсинг HTML, метаданных, подсчёт токенов).
        override_messages — если задан, используется вместо системного промпта + истории (для 2-го прохода).
        override_timeout — таймаут именно этого вызова (для 2-го прохода — по остатку времени)."""
        msgs = override_messages if override_messages is not None else chat_messages
        # Anthropic принимает system отдельным полем, а не как сообщение с role=system.
        sys_prompt = effective_system_prompt
        anthropic_messages = []
        for m in msgs:
            role = m.get('role', 'user')
            if role == 'system':
                sys_prompt = m.get('content', '') or sys_prompt
                continue
            anthropic_messages.append({'role': role, 'content': m.get('content', '')})
        call_timeout = override_timeout or ai_timeout
        payload = json.dumps({
            'model': model_id,
            'system': sys_prompt,
            'messages': anthropic_messages,
            'max_tokens': override_max_tokens or max_tokens,
        }).encode('utf-8')
        req = urllib.request.Request(
            'https://api.anthropic.com/v1/messages',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': anthropic_api_key,
                'anthropic-version': '2023-06-01',
            },
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=call_timeout) as response:
                res = json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            try:
                body = e.read().decode('utf-8')
            except Exception:
                body = ''
            log(f'Anthropic HTTPError {e.code} for model={model_id}: {body[:500]}')
            return None, (e.code, body)
        except (urllib.error.URLError, TimeoutError, socket.timeout) as e:
            log(f'Anthropic network error for model={model_id}: {repr(e)[:200]}')
            return None, ('network', repr(e))
        except (json.JSONDecodeError, Exception) as e:
            log(f'Anthropic parse error for model={model_id}: {repr(e)[:200]}')
            return None, ('parse', repr(e))
        if isinstance(res, dict) and res.get('type') == 'error':
            api_err = res.get('error') or {}
            msg = api_err.get('message') if isinstance(api_err, dict) else str(api_err)
            log(f'Anthropic body error for model={model_id}: {str(msg)[:500]}')
            return None, ('body', str(msg))
        # Переводим ответ Anthropic в общий формат.
        content_blocks = res.get('content') or []
        text = ''.join(b.get('text', '') for b in content_blocks if isinstance(b, dict) and b.get('type') == 'text')
        usage = res.get('usage') or {}
        normalized = {
            'choices': [{'message': {'content': text}}],
            'usage': {
                'prompt_tokens': usage.get('input_tokens', 0),
                'completion_tokens': usage.get('output_tokens', 0),
            },
        }
        return normalized, None

    # ── РЕЖИМ СТРИМИНГА (SSE) ──────────────────────────────────────────────────────────
    # Лайв-сборка сайта в редакторе: отдаём токены Anthropic по мере генерации, чтобы
    # пользователь видел, как сайт собирается в реальном времени, а не ждал ~100с молча.
    # Второй (арт-директорский) проход в стрим-режиме НЕ выполняется — стримим один проход.
    if stream_mode:
        def _sse(event: str, data: dict) -> str:
            return f'event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n'

        def _stream_gen():
            full_parts = []
            in_tokens = 0
            out_tokens = 0
            refunded = False
            try:
                yield _sse('start', {'model': ANTHROPIC_MODEL, 'is_edit': is_edit, 'cost': request_cost})
                anthropic_messages = [
                    {'role': m.get('role', 'user'), 'content': m.get('content', '')}
                    for m in chat_messages if m.get('role') != 'system'
                ]
                payload = json.dumps({
                    'model': ANTHROPIC_MODEL,
                    'system': effective_system_prompt,
                    'messages': anthropic_messages,
                    'max_tokens': max_tokens,
                    'stream': True,
                }).encode('utf-8')
                req = urllib.request.Request(
                    'https://api.anthropic.com/v1/messages',
                    data=payload,
                    headers={
                        'Content-Type': 'application/json',
                        'x-api-key': anthropic_api_key,
                        'anthropic-version': '2023-06-01',
                    },
                    method='POST',
                )
                # Таймаут на КАЖДОЕ чтение из сокета (не на весь стрим). Первый токен может
                # прийти с задержкой (модель «думает»), поэтому запас щедрый.
                with urllib.request.urlopen(req, timeout=max(90, ai_timeout)) as response:
                    for raw_line in response:
                        line = raw_line.decode('utf-8', 'ignore').strip()
                        if not line or not line.startswith('data:'):
                            continue
                        try:
                            evt = json.loads(line[5:].strip())
                        except Exception:
                            continue
                        etype = evt.get('type')
                        if etype == 'message_start':
                            in_tokens = ((evt.get('message') or {}).get('usage') or {}).get('input_tokens', 0)
                        elif etype == 'content_block_delta':
                            delta = evt.get('delta') or {}
                            if delta.get('type') == 'text_delta':
                                chunk = delta.get('text', '')
                                if chunk:
                                    full_parts.append(chunk)
                                    yield _sse('token', {'t': chunk})
                        elif etype == 'message_delta':
                            out_tokens = (evt.get('usage') or {}).get('output_tokens', out_tokens)
                        elif etype == 'error':
                            raise RuntimeError(str(evt.get('error'))[:300])

                total_tokens = in_tokens + out_tokens
                raw_html = ''.join(full_parts).strip()
                html_out, report_md = extract_report_block(raw_html)
                html_out, meta = extract_meta_block(html_out)
                html_out = strip_progress_markers(html_out)  # финальный HTML — без служебных маркеров

                # Уточняющий вопрос: модель прислала только служебный блок с question, без HTML.
                question = (meta.get('question') or '').strip() if isinstance(meta, dict) else ''
                if question and len(html_out.strip()) < 200:
                    refund_quota(user_id, schema, request_cost); refunded = True
                    yield _sse('question', {'message': question, 'tokens': total_tokens, 'remaining': remaining})
                    return

                html_out = html_out.strip()
                if html_out.startswith('```'):
                    lines = html_out.split('\n')
                    html_out = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
                was_truncated = not html_out.lower().rstrip().endswith('</html>')
                html_out = repair_truncated_html(html_out.strip())

                # Те же защиты от потери блоков/белого экрана, что и в обычном режиме.
                if is_edit and was_truncated:
                    refund_quota(user_id, schema, request_cost); refunded = True
                    yield _sse('error', {'message': 'Правка не поместилась целиком — сайт слишком большой. Сайт оставлен без изменений, попросите изменение попроще.'})
                    return
                if is_edit and not was_truncated and len(html_out) < len(current_html) * 0.7:
                    refund_quota(user_id, schema, request_cost); refunded = True
                    yield _sse('error', {'message': 'Часть блоков могла потеряться при правке — сайт оставлен без изменений. Повторите правку или уточните её.'})
                    return
                # Тихая потеря секций: правка вернула МЕНЬШЕ крупных блоков, а убрать ничего не просили.
                if is_edit and not was_truncated and count_major_blocks(html_out) < count_major_blocks(current_html) and not is_removal_request(last_user_content):
                    refund_quota(user_id, schema, request_cost); refunded = True
                    yield _sse('error', {'message': 'При правке пропали секции сайта — оставил прежнюю версию, чтобы блоки не потерялись. Повторите правку чуть иначе или попросите точечное изменение.'})
                    return
                import re as _re
                body_match = _re.search(r'<body[^>]*>(.*?)</body>', html_out, _re.IGNORECASE | _re.DOTALL)
                body_inner = body_match.group(1) if body_match else ''
                visible = _re.sub(r'<(script|style)[^>]*>.*?</\1>', '', body_inner, flags=_re.IGNORECASE | _re.DOTALL)
                visible = _re.sub(r'<[^>]+>', '', visible).strip()
                if len(visible) < 10 and '<img' not in body_inner.lower() and '<svg' not in body_inner.lower():
                    refund_quota(user_id, schema, request_cost); refunded = True
                    yield _sse('error', {'message': 'Сайт не успел сгенерироваться полностью. Попробуйте ещё раз или упростите запрос.'})
                    return

                if not meta.get('intro') and not meta.get('steps'):
                    meta = build_meta_from_html(html_out, is_edit)
                if project_id:
                    save_html(int(project_id), html_out, schema)
                maybe_notify_low_balance(user_id, remaining, schema)

                yield _sse('done', {
                    'html': html_out,
                    'tokens': total_tokens,
                    'remaining': remaining,
                    'large_task': is_large_task,
                    'cost': request_cost,
                    'report': report_md,
                    'intro': meta.get('intro', ''),
                    'summary': meta.get('summary', ''),
                    'steps': meta.get('steps', []),
                    'design': meta.get('design', ''),
                    'sections': meta.get('sections', []),
                    'suggestions': meta.get('suggestions', []),
                })
            except urllib.error.HTTPError as e:
                if not refunded:
                    refund_quota(user_id, schema, request_cost)
                try:
                    err_body = e.read().decode('utf-8')
                except Exception:
                    err_body = ''
                log(f'stream Anthropic HTTPError {e.code}: {err_body[:300]}')
                msg = 'На балансе Anthropic закончились средства. Пополните счёт Anthropic.' if e.code == 402 else 'AI-сервис временно недоступен. Попробуйте через минуту.'
                yield _sse('error', {'message': msg})
            except Exception as e:
                if not refunded:
                    refund_quota(user_id, schema, request_cost)
                log(f'stream error: {repr(e)[:300]}')
                yield _sse('error', {'message': 'AI не успел ответить вовремя. Попробуйте ещё раз или упростите запрос.'})

        sse_headers = {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
        }
        return {'statusCode': 200, 'headers': sse_headers, 'stream': _stream_gen()}
    # ── КОНЕЦ РЕЖИМА СТРИМИНГА ─────────────────────────────────────────────────────────

    result, error_info = call_anthropic(ANTHROPIC_MODEL)

    if error_info is not None:
        code, detail = error_info
        log(f'Anthropic call failed: code={code} detail={str(detail)[:300]}')
        refund_quota(user_id, schema, request_cost)
        if code == 'network':
            return err('AI не успел ответить вовремя. Упростите запрос и попробуйте снова.', 504)
        if code == 402:
            return err('На балансе Anthropic закончились средства. Пополните счёт Anthropic.', 502)
        return err('AI-сервис временно недоступен. Попробуйте через минуту.', 502)

    choices = result.get('choices') or []
    if not choices:
        refund_quota(user_id, schema, request_cost)
        log(f'OpenRouter empty choices: {json.dumps(result)[:500]}')
        return err('AI вернул пустой ответ.', 502)

    html = (choices[0].get('message', {}).get('content') or '').strip()
    if not html:
        refund_quota(user_id, schema, request_cost)
        return err('AI вернул пустой HTML.', 502)

    usage = result.get('usage', {})
    tokens = usage.get('prompt_tokens', 0) + usage.get('completion_tokens', 0)

    # Извлекаем служебный блок метаданных (теперь он в КОНЦЕ ответа, после </html>) и убираем
    # его из HTML. Парсер ищет блок в любом месте, поэтому позиция не важна.
    html, report_md = extract_report_block(html)
    html, meta = extract_meta_block(html)
    html = strip_progress_markers(html)  # служебные маркеры нужны только в стриме

    # УТОЧНЯЮЩИЙ ВОПРОС: если задача была слишком расплывчата, модель по инструкции присылает
    # ТОЛЬКО служебный блок с полем "question" и без HTML. В этом случае не считаем это сайтом —
    # возвращаем квоту (уточнение не должно стоить пользователю запроса) и отдаём во фронтенд
    # обычный текстовый вопрос, а не пытаемся сохранить пустой/битый HTML.
    question = (meta.get('question') or '').strip() if isinstance(meta, dict) else ''
    if question and len(html.strip()) < 200:
        refund_quota(user_id, schema, request_cost)
        return ok({
            'html': '',
            'message': question,
            'is_question': True,
            'tokens': tokens,
            'remaining': remaining,
        })

    # Убираем markdown-обёртку если есть
    html = html.strip()
    if html.startswith('```'):
        lines = html.split('\n')
        html = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])

    # Запоминаем, был ли ответ оборван ДО починки (не заканчивался на </html>) — это признак,
    # что модель не успела дописать сайт и часть блоков потерялась.
    was_truncated = not html.lower().rstrip().endswith('</html>')

    # Страховка: если модель всё же оборвала HTML (упёрлась в лимит токенов) — аккуратно
    # закрываем недописанные ключевые теги, чтобы превью не оставалось пустым белым экраном.
    html = repair_truncated_html(html)

    # ЗАЩИТА ОТ ПОТЕРИ БЛОКОВ ПРИ ПРАВКЕ (ГЛАВНОЕ): при правке модель возвращает ВЕСЬ сайт заново.
    # Если ответ оборвался (не закончился на </html>) — последняя секция обрезана, блоки потеряны.
    # ВАЖНО: проверяем именно факт обрыва, а НЕ длину — при добавлении секции сайт становится
    # длиннее, но всё равно может быть оборван на конце (эта дыра и ломала сайт раньше).
    # Оборванную правку НЕ сохраняем: оставляем прежний целый сайт и просим повторить попроще.
    if is_edit and was_truncated:
        refund_quota(user_id, schema, request_cost)
        return err('Правка не поместилась целиком — сайт слишком большой, чтобы переписать его за один раз. Сайт оставлен без изменений (блоки не потеряны). Попросите изменение попроще — например, поправить один конкретный блок.', 503)

    # Дополнительно: если при правке HTML внезапно стал заметно короче исходного — модель могла
    # «выкинуть» блоки даже без формального обрыва. Тоже не сохраняем.
    if is_edit and not was_truncated and len(html) < len(current_html) * 0.7:
        refund_quota(user_id, schema, request_cost)
        return err('Похоже, часть блоков могла потеряться при правке — сайт оставлен без изменений. Повторите правку или уточните её.', 503)

    # Тихая потеря секций: правка вернула МЕНЬШЕ крупных блоков, а убрать ничего не просили.
    if is_edit and not was_truncated and count_major_blocks(html) < count_major_blocks(current_html) and not is_removal_request(last_user_content):
        refund_quota(user_id, schema, request_cost)
        return err('При правке пропали секции сайта — оставил прежнюю версию, чтобы блоки не потерялись. Повторите правку чуть иначе или попросите точечное изменение.', 503)

    # ФИНАЛЬНАЯ ЗАЩИТА ОТ БЕЛОГО ЭКРАНА: проверяем, есть ли внутри <body> реальный видимый
    # контент. Если модель оборвалась ещё в <head> (тело пустое) — сайт показывать нельзя.
    # В этом случае НЕ сохраняем пустышку, возвращаем квоту и просим повторить — это честнее,
    # чем показать белый экран и списать запрос.
    import re as _re
    body_match = _re.search(r'<body[^>]*>(.*?)</body>', html, _re.IGNORECASE | _re.DOTALL)
    body_inner = body_match.group(1) if body_match else ''
    # Убираем скрипты/стили/пробелы — остаётся ли что-то видимое?
    visible = _re.sub(r'<(script|style)[^>]*>.*?</\1>', '', body_inner, flags=_re.IGNORECASE | _re.DOTALL)
    visible = _re.sub(r'<[^>]+>', '', visible).strip()
    if len(visible) < 10 and '<img' not in body_inner.lower() and '<svg' not in body_inner.lower():
        refund_quota(user_id, schema, request_cost)
        return err('Сайт не успел сгенерироваться полностью. Попробуйте ещё раз или упростите запрос.', 503)

    # АВТО-УЛУЧШЕНИЕ В 2 ПРОХОДА: только для создания нового сайта (не правки!) и только если
    # реально остался запас времени. Проверяем фактически прошедшее время: если первый проход
    # был долгим, второй НЕ запускаем — иначе функция упрётся в таймаут и сломает результат.
    elapsed = _time.monotonic() - started_at
    remaining_time = function_timeout - elapsed - 15  # -15 сек буфер на завершение и запись в БД
    second_pass_tokens = min(max_tokens, int(remaining_time * 130)) if remaining_time > 0 else 0
    # Запас времени должен быть большим (>=35 сек), иначе 2-й проход рискует упереться в таймаут.
    if function_timeout >= 60 and not is_edit and 1500 < len(html) < 50000 and remaining_time >= 35 and second_pass_tokens >= 2000:
        improve_prompt = (
            "Ты — придирчивый арт-директор и копирайтер. Вот готовый HTML-сайт. "
            "Критически улучши его как финальную версию: усиль дизайн (контраст, отступы, единый визуальный ритм, "
            "выразительный hero, аккуратные карточки, hover-эффекты, чередование фонов секций), сделай текст более продающим "
            "и живым (сильный оффер, человеческие CTA, конкретные преимущества, правдоподобные отзывы — без «воды»). "
            "НИЧЕГО не ломай, сохрани структуру и рабочие ссылки на картинки. Верни ТОЛЬКО улучшенный полный HTML-документ "
            "целиком от <!DOCTYPE html> до </body></html>, без markdown и пояснений."
        )
        improved_res, improved_err = call_anthropic(
            ANTHROPIC_MODEL,
            override_messages=[
                {'role': 'system', 'content': improve_prompt},
                {'role': 'user', 'content': html[:55000]},
            ],
            override_max_tokens=second_pass_tokens,
            override_timeout=max(12, int(remaining_time)),
        )
        if improved_err is None and improved_res:
            imp_choices = improved_res.get('choices') or []
            imp_html = (imp_choices[0].get('message', {}).get('content') or '').strip() if imp_choices else ''
            imp_html = imp_html.strip()
            if imp_html.startswith('```'):
                lines = imp_html.split('\n')
                imp_html = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
            imp_html, _imp_meta = extract_meta_block(imp_html)
            imp_html = repair_truncated_html(imp_html.strip())
            # Принимаем результат 2-го прохода только если он валиден и не оборвался.
            if imp_html.lower().rstrip().endswith('</html>') and len(imp_html) > 1500:
                html = imp_html
                imp_usage = improved_res.get('usage', {})
                tokens += imp_usage.get('prompt_tokens', 0) + imp_usage.get('completion_tokens', 0)

    # Если модель не прислала служебный блок описания (частый случай при 30-сек лимите —
    # HTML успел, а метаданные в конце нет) — строим описание работы прямо из готового HTML,
    # чтобы в чате ВСЕГДА был живой отчёт о проделанной работе, а не «пусто».
    if not meta.get('intro') and not meta.get('steps'):
        meta = build_meta_from_html(html, is_edit)

    # Сохраняем HTML в проект если передан project_id
    if project_id:
        save_html(int(project_id), html, schema)

    # Уведомление шлём только теперь, когда сайт уже готов — чтобы никак не задерживать генерацию
    maybe_notify_low_balance(user_id, remaining, schema)

    return ok({
        'html': html,
        'tokens': tokens,
        'remaining': remaining,
        'large_task': is_large_task,
        'cost': request_cost,
        'report': report_md,
        'intro': meta.get('intro', ''),
        'summary': meta.get('summary', ''),
        'steps': meta.get('steps', []),
        'design': meta.get('design', ''),
        'sections': meta.get('sections', []),
        'suggestions': meta.get('suggestions', []),
    })