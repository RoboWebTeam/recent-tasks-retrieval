import os
import json
import socket
import smtplib
import urllib.request
import urllib.error
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

LOW_BALANCE_THRESHOLD = 5

SYSTEM_PROMPT = """Ты — профессиональный веб-разработчик. Создавай красивые, современные одностраничные сайты (HTML + CSS + JS) в одном файле.

Правила:
1. Возвращай ТОЛЬКО валидный HTML-документ, без markdown, без объяснений
2. Используй встроенный CSS в теге <style> и JS в теге <script>
3. Подключай красивые шрифты через Google Fonts CDN (например пара: акцидентный для заголовков + читаемый для текста)
4. Сайт полностью адаптивный (mobile-first), с @media-запросами
5. Используй CSS-переменные для цветов и единой палитры
6. Не используй внешние JS-библиотеки кроме Google Fonts

6a. ИЗОБРАЖЕНИЯ — КРИТИЧЕСКИ ВАЖНО (частая причина «битых» картинок): НИКОГДА не выдумывай ссылки на картинки и не бери случайные URL (example.com, произвольные unsplash-ссылки с ID, вымышленные пути) — они не загружаются и превью показывает сломанный значок. Используй ТОЛЬКО гарантированно работающие источники:
   - Фото по теме: https://source.unsplash.com/1600x900/?КЛЮЧЕВЫЕ,СЛОВА (например ?barbershop,haircut) — Unsplash сам подберёт реальное фото по ключевым словам;
   - Нейтральные заглушки: https://picsum.photos/800/600 (можно с seed: https://picsum.photos/seed/любоеслово/800/600);
   - Аватары/логотипы: https://placehold.co/400x400 или эмодзи/иконки/CSS-фигуры.
   Для фоновых блоков и hero предпочитай CSS linear-gradient вместо картинок — это всегда красиво и не «ломается». У каждого <img> ОБЯЗАТЕЛЬНО указывай alt и width/height.

7. КАЧЕСТВО ДИЗАЙНА — ГЛАВНЫЙ ПРИОРИТЕТ. Сайт должен выглядеть дорого, современно и продающе, уровня топовой студии. ОБЯЗАТЕЛЬНО применяй:
   - Фирменную палитру: основной + 1-2 акцентных цвета + градиенты (linear-gradient) на hero и кнопках
   - Крупные выразительные заголовки, хорошую иерархию и «воздух» (щедрые отступы padding)
   - Выразительную hero-секцию с сильным оффером, подзаголовком и заметной CTA-кнопкой
   - Карточки с box-shadow, border-radius (16-24px), аккуратной сеткой (grid/flex)
   - hover-эффекты на кнопках и карточках (transform, тень), плавные transition
   - Анимации появления блоков при прокрутке, иконки/эмодзи для наглядности
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

8. КОМПАКТНОСТЬ РАДИ КРАСОТЫ (важно!): лучше 3-4 ИДЕАЛЬНО оформленные секции, чем 7 сырых и уродливых. НЕ гонись за количеством секций — вложи всё качество в меньшее число блоков. Пиши CSS сжато (короткие селекторы, без дублей), чтобы времени и места хватило на красоту и полное завершение документа.
9. ЦЕЛОСТНОСТЬ: документ ОБЯЗАТЕЛЬНО заканчивается на </body></html>. Если не хватает места — убери лишнюю секцию, но НИКОГДА не обрывай CSS или тег на середине. Красивый компактный сайт всегда лучше длинного оборванного.
9a. САМОПРОВЕРКА перед выдачей (мысленно пройди чек-лист): весь текст читается на своём фоне? отступы единообразны и есть «воздух»? hero цепляет с первого экрана? текст продающий, без «воды»? все теги закрыты и есть </body></html>? Если что-то не так — исправь ПЕРЕД выдачей.

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
- summary — 2-3 предложения: что в итоге получилось и чем сайт хорош, с гордостью за результат. ОБЯЗАТЕЛЬНО заверши summary живым вовлекающим вопросом-предложением продолжить работу вместе — предложи конкретное следующее улучшение именно для этого сайта (например: «Готово! Хотите, добавлю блок отзывов и форму записи, чтобы сайт лучше продавал?» или «Могу ещё усилить hero и добавить галерею работ — поработаем над этим?»). Вопрос должен звать пользователя развивать проект дальше.
- steps — 5-8 пунктов ЖИВЫМ языком, каждый про конкретное действие с деталью и лёгкой эмоцией (примеры: «Собрал цепляющий hero с крупным оффером и кнопкой записи», «Подобрал тёплую палитру #6F4E37 под атмосферу кофейни», «Добавил секцию отзывов со звёздами — это повышает доверие», «Настроил плавные анимации появления блоков при скролле»). Для правок — что нашёл и что именно изменил.
- design — 1 живое предложение про дизайн-решение: палитра, шрифты, настроение (зачем именно так).
- sections — 3-6 коротких названий секций.
- suggestions — 3-4 УМЕСТНЫЕ именно для этого сайта идеи развития (что добавить дальше). Каждая: icon (Star, Phone, Calendar, MessageSquare, MapPin, ShoppingCart, Image, Users, Award, Mail, CreditCard, Clock), label (2-4 слова), prompt (готовая команда мне на выполнение).
Никакого markdown и лишнего текста. Только HTML, затем строка метаданных."""

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

Если пользователь просит использовать своё изображение, логотип или фото — вставляй в <img src="..."> ТОЧНУЮ ссылку из списка выше, ничего не выдумывай. Если подходящего изображения в списке нет — используй только надёжные источники из правила 6a (source.unsplash.com по ключевым словам, picsum.photos, placehold.co) или CSS-градиент. НИКОГДА не придумывай URL картинок."""

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
        summary = 'Готово! Изменения внесены, всё остальное на сайте сохранено. Хотите продолжим — что улучшим или добавим дальше? Могу усилить дизайн, добавить новый блок или доработать текст 🚀'
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

        summary = 'Готово! Собрал ' + ('насыщенный ' if n_sections >= 5 else '') + 'современный сайт — он уже открыт в превью справа. Хотите поработаем над ним ещё? Могу добавить новые секции, усилить дизайн или сделать текст ещё продающее — с чего начнём? 🚀'

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
    """Генерирует HTML-код сайта через Claude Sonnet или GPT-4o (оба через OpenRouter) по описанию пользователя"""

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
    model_choice = body.get('model', 'claude')
    current_html = body.get('current_html', '')
    style_choice = body.get('style', '')  # выбранный стиль-пресет (minimal/premium/bright/dark)

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
2. Верни ПОЛНЫЙ обновлённый HTML-документ целиком от <!DOCTYPE html> до </body></html> (не фрагмент, не diff, без markdown).
3. КРИТИЧЕСКИ ВАЖНО: документ ОБЯЗАТЕЛЬНО должен быть завершён и заканчиваться на </body></html>. НИКОГДА не обрывай код на середине тега, стиля или блока — иначе сайт сломается и блоки пропадут. Если правка большая — всё равно уложись и заверши документ целиком."""
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

    # Быстрые модели (gemini/claude/gpt-4o) дают отличное качество для лендингов/визиток
    # за 5-15 секунд. Мощные модели (opus/sonnet) — топовое качество, но заметно медленнее:
    # рекомендованы при увеличенном таймауте функции (FUNCTION_TIMEOUT_SEC=90).
    OPENROUTER_MODELS = {
        'gpt-4o': 'openai/gpt-4o-mini',
        'claude': 'anthropic/claude-haiku-4.5',
        'gemini': 'google/gemini-2.5-flash',
        'opus': 'anthropic/claude-opus-4-8',
        'sonnet': 'anthropic/claude-sonnet-5',
    }
    model_name = OPENROUTER_MODELS.get(model_choice, OPENROUTER_MODELS['gemini'])

    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if not api_key:
        return err('OpenRouter API ключ не настроен')

    # Бюджет времени функции. По умолчанию платформа даёт 30 сек; если в настройках
    # (Ядро → Функции → generate-site) таймаут поднят вручную — задаём переменную окружения
    # FUNCTION_TIMEOUT_SEC (напр. 90), и код автоматически использует бОльший бюджет.
    # Это ключ к устранению ошибки 504: внутренний таймаут запроса к AI ВСЕГДА должен быть
    # меньше лимита функции, иначе платформа убивает функцию раньше, чем мы вернём ответ.
    function_timeout = int(os.environ.get('FUNCTION_TIMEOUT_SEC', '30'))

    # Мощные модели (Sonnet/Opus) физически НЕ укладываются в 30-секундный лимит функции —
    # они долго «рассуждают» и упираются в жёсткий таймаут платформы (504) раньше, чем мы
    # успеваем перехватить. Пока лимит функции не поднят, не даём выбрать их впустую:
    # сразу возвращаем понятную подсказку и НЕ списываем запрос.
    SLOW_MODELS = {'opus', 'sonnet'}
    if model_choice in SLOW_MODELS and function_timeout <= 35:
        refund_quota(user_id, schema, request_cost)
        return err('Модели Sonnet и Opus слишком мощные для быстрой генерации и не успевают ответить. Выберите Gemini или Claude — они быстрые и отлично справляются с сайтами.', 400)
    # Оставляем ~7 сек запаса на чтение ответа, очистку HTML и запись в БД.
    ai_timeout = max(12, function_timeout - 7)
    # Длину ответа масштабируем под РЕАЛЬНЫЙ бюджет времени. При 30-сек лимите функции модель
    # успевает сгенерировать ~4000 токенов до обрыва — ставим именно столько, чтобы документ
    # ГАРАНТИРОВАННО дописался целиком (лучше компактный целый сайт, чем длинный оборванный —
    # именно обрыв давал белый экран). При увеличенном лимите (90 сек) — можно больше.
    max_tokens = 5000 if function_timeout <= 35 else 10000
    # Усиленная генерация (крупная задача): даём модели больше места на детальный сайт.
    if is_large_task:
        max_tokens = 6500 if function_timeout <= 35 else 14000

    # КРИТИЧНО ДЛЯ ПРАВОК: модель возвращает ВЕСЬ сайт целиком заново. Если max_tokens меньше
    # размера текущего HTML — ответ обрывается на середине и блоки пропадают (баг «ломается превью»).
    # Поэтому при правке даём лимит с запасом: (текущий HTML в токенах ≈ len/3) + 1500 на изменения.
    if current_html:
        needed = len(current_html) // 3 + 1500
        # Верхний потолок зависит от бюджета времени: при 30 сек не даём слишком много (иначе таймаут).
        ceiling = 8000 if function_timeout <= 35 else 20000
        max_tokens = max(max_tokens, min(needed, ceiling))

    effective_system_prompt = system_prompt
    # Выбранный стиль-пресет — точная эстетика вместо угадывания.
    if style_choice in STYLE_PRESETS and not current_html:
        effective_system_prompt += "\n\n" + STYLE_PRESETS[style_choice]
    # Крупная задача: даём чуть больше блоков, но с сохранением принципа «красота важнее объёма».
    if is_large_task:
        sections_hint = '4-5' if function_timeout <= 35 else '6-8'
        effective_system_prompt += (
            f"\n\nЭто более крупная задача — сделай {sections_hint} содержательных, но КРАСИВО оформленных секций "
            "(например: hero, преимущества, услуги/каталог, отзывы, форма/контакты). "
            "Каждая секция должна быть проработана визуально. Всё равно приоритет — красота и завершённость: "
            "лучше меньше секций, но идеальных. ОБЯЗАТЕЛЬНО заверши документ на </body></html>."
        )

    def call_openrouter(model_id: str, override_messages=None, override_max_tokens=None):
        """Один вызов OpenRouter. Возвращает (result_dict | None, error_info).
        error_info = None при успехе, иначе (http_code, текст_причины).
        override_messages — если задан, используется вместо системного промпта + истории (для 2-го прохода)."""
        msgs = override_messages if override_messages is not None else ([{'role': 'system', 'content': effective_system_prompt}] + chat_messages)
        payload = json.dumps({
            'model': model_id,
            'messages': msgs,
            'max_tokens': override_max_tokens or max_tokens,
            'temperature': 0.7,
            'reasoning': {'effort': 'low', 'exclude': True},
        }).encode('utf-8')
        req = urllib.request.Request(
            'https://openrouter.ai/api/v1/chat/completions',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
                'HTTP-Referer': 'https://roboweb.site',
                'X-Title': 'Roboweb',
            },
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=ai_timeout) as response:
                res = json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            try:
                body = e.read().decode('utf-8')
            except Exception:
                body = ''
            print(f'OpenRouter HTTPError {e.code} for model={model_id}: {body[:500]}')
            return None, (e.code, body)
        except (urllib.error.URLError, TimeoutError, socket.timeout) as e:
            print(f'OpenRouter network error for model={model_id}: {repr(e)[:200]}')
            return None, ('network', repr(e))
        except (json.JSONDecodeError, Exception) as e:
            print(f'OpenRouter parse error for model={model_id}: {repr(e)[:200]}')
            return None, ('parse', repr(e))
        # HTTP 200, но с ошибкой в теле (модель упала на стороне провайдера)
        if isinstance(res, dict) and res.get('error'):
            api_err = res.get('error')
            msg = api_err.get('message') if isinstance(api_err, dict) else str(api_err)
            print(f'OpenRouter body error for model={model_id}: {str(msg)[:500]}')
            return None, ('body', str(msg))
        return res, None

    # Основной вызов. Если выбранная модель упала из-за проблемы С МОДЕЛЬЮ (недоступна/битый ответ) —
    # автоматически повторяем на быстром Gemini, чтобы пользователь всё равно получил сайт.
    result, error_info = call_openrouter(model_name)

    if error_info is not None:
        code, detail = error_info
        # Сетевой таймаут — не тот случай для фолбэка, честно сообщаем.
        if code == 'network':
            refund_quota(user_id, schema, request_cost)
            return err('AI не успел ответить вовремя. Упростите запрос или выберите другую модель.', 504)
        # Нет средств на OpenRouter — фолбэк не поможет.
        if code == 402:
            refund_quota(user_id, schema, request_cost)
            return err('На балансе OpenRouter закончились средства. Пополните счёт OpenRouter.', 502)
        # Проблема с моделью или её ответом — пробуем запасной Gemini (если ещё не он).
        fallback = OPENROUTER_MODELS['gemini']
        if model_name != fallback:
            print(f'Fallback to {fallback} after error {code} on {model_name}')
            result, error_info = call_openrouter(fallback)

        if error_info is not None:
            refund_quota(user_id, schema, request_cost)
            return err('AI-сервис временно недоступен. Попробуйте через минуту или выберите другую модель.', 502)

    choices = result.get('choices') or []
    if not choices:
        refund_quota(user_id, schema, request_cost)
        print(f'OpenRouter empty choices: {json.dumps(result)[:500]}')
        return err('AI вернул пустой ответ.', 502)

    html = (choices[0].get('message', {}).get('content') or '').strip()
    if not html:
        refund_quota(user_id, schema, request_cost)
        return err('AI вернул пустой HTML.', 502)

    usage = result.get('usage', {})
    tokens = usage.get('prompt_tokens', 0) + usage.get('completion_tokens', 0)

    # Извлекаем служебный блок метаданных (теперь он в КОНЦЕ ответа, после </html>) и убираем
    # его из HTML. Парсер ищет блок в любом месте, поэтому позиция не важна.
    html, meta = extract_meta_block(html)

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

    # ЗАЩИТА ОТ ПОТЕРИ БЛОКОВ ПРИ ПРАВКЕ: если это правка, ответ был оборван, и новый HTML
    # заметно короче исходного (>15% контента пропало) — значит модель не дописала сайт и блоки
    # потерялись. НЕ сохраняем поломанную версию: оставляем прежний сайт и просим повторить.
    if is_edit and was_truncated and len(html) < len(current_html) * 0.85:
        refund_quota(user_id, schema, request_cost)
        return err('Правка не поместилась целиком и часть блоков могла потеряться. Сайт оставлен без изменений — повторите правку меньшими шагами или уточните её.', 503)

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

    # АВТО-УЛУЧШЕНИЕ В 2 ПРОХОДА: если есть запас времени (таймаут функции поднят до 60+ сек),
    # это создание нового сайта и HTML получился нормального размера — просим модель КРИТИЧЕСКИ
    # оценить свою работу и вернуть улучшенную версию (дизайн, контраст, продающий текст).
    # При 30-сек лимите пропускаем — второй проход не успеет.
    if function_timeout >= 60 and not is_edit and 1500 < len(html) < 60000:
        improve_prompt = (
            "Ты — придирчивый арт-директор и копирайтер. Вот готовый HTML-сайт. "
            "Критически улучши его как финальную версию: усиль дизайн (контраст, отступы, единый визуальный ритм, "
            "выразительный hero, аккуратные карточки, hover-эффекты, чередование фонов секций), сделай текст более продающим "
            "и живым (сильный оффер, человеческие CTA, конкретные преимущества, правдоподобные отзывы — без «воды»). "
            "НИЧЕГО не ломай, сохрани структуру и рабочие ссылки на картинки. Верни ТОЛЬКО улучшенный полный HTML-документ "
            "целиком от <!DOCTYPE html> до </body></html>, без markdown и пояснений."
        )
        improved_res, improved_err = call_openrouter(
            model_name,
            override_messages=[
                {'role': 'system', 'content': improve_prompt},
                {'role': 'user', 'content': html[:55000]},
            ],
            override_max_tokens=max_tokens,
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
        'intro': meta.get('intro', ''),
        'summary': meta.get('summary', ''),
        'steps': meta.get('steps', []),
        'design': meta.get('design', ''),
        'sections': meta.get('sections', []),
        'suggestions': meta.get('suggestions', []),
    })