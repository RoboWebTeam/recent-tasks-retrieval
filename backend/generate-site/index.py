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
3. Стиль: современный минимализм, красивые шрифты (Google Fonts), анимации
4. Подключай шрифты через Google Fonts CDN
5. Сайт должен быть полностью адаптивным (mobile-first)
6. Используй CSS-переменные для цветов
7. Добавляй плавные анимации появления элементов
8. Не используй внешние JS-библиотеки кроме Google Fonts
9. Сайт должен выглядеть профессионально и продающе
9a. ВАЖНО ПРО ОБЪЁМ И ЦЕЛОСТНОСТЬ (у тебя лимит на длину ответа ~10000 токенов — этого достаточно на насыщенный сайт из 5-7 секций):
- Пиши аккуратный, читаемый код без лишних повторов, но не экономь на качестве — можно 5-7 полноценных секций с хорошей вёрсткой.
- РАСПРЕДЕЛЯЙ бюджет: обязательно оставь место, чтобы дописать HTML тела и закрыть ВСЕ теги. Документ ДОЛЖЕН заканчиваться на </body></html>.
- Если чувствуешь, что не хватает места — сокращай контент, но НИКОГДА не обрывай документ на середине <style> или тега. Целый сайт лучше длинного оборванного.

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
Заполни метаданные живо, от первого лица, на языке пользователя:
- intro — 1 предложение: как ты понял задачу.
- summary — 2-3 предложения: что получилось.
- steps — 4-6 пунктов, что конкретно сделано (для правки — что нашёл и изменил; для нового — как собирал).
- design — 1 предложение про палитру/шрифты/стиль.
- sections — 3-6 коротких названий секций.
- suggestions — 3-4 идеи улучшений. Каждая: icon (Star, Phone, Calendar, MessageSquare, MapPin, ShoppingCart, Image, Users, Award, Mail, CreditCard, Clock), label (2-4 слова), prompt (готовая команда).
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

Если пользователь просит использовать своё изображение, логотип или фото — вставляй в <img src="..."> ТОЧНУЮ ссылку из списка выше, ничего не выдумывай. Если подходящего изображения в списке нет — используй заглушку или подходящую внешнюю картинку."""

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

    if not messages:
        return err('Нет сообщений')

    # Определяем стоимость запроса ДО списания: крупная задача (новый насыщенный сайт —
    # магазин, лендинг с множеством секций, подробное ТЗ) стоит дороже и генерируется детальнее.
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

Внеси только запрошенное изменение, сохрани всё остальное содержимое и структуру без изменений. Верни ПОЛНЫЙ обновлённый HTML-документ целиком (не фрагмент, не diff)."""
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
        'opus': 'anthropic/claude-opus-4.8',
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

    # Установка на КРАСИВЫЙ дизайн для ЛЮБОГО сайта (не только крупного) — чтобы даже простые
    # запросы давали современный «вау»-результат, а не скудную страницу.
    effective_system_prompt = system_prompt + (
        "\n\nКАЧЕСТВО ДИЗАЙНА (важно): делай сайт визуально дорогим и современным, уровня топовых студий. "
        "Обязательно: продуманная цветовая палитра с акцентным цветом и градиентами, красивая типографика (крупные заголовки), "
        "выразительная hero-секция, карточки с тенями и скруглениями, hover-эффекты, плавные анимации появления при прокрутке, "
        "иконки/эмодзи для наглядности, хороший ритм отступов и «воздух». Никакого скучного чёрного текста на белом фоне без акцентов."
    )
    # Для крупной задачи усиливаем ещё сильнее — больше секций и проработки.
    if is_large_task:
        effective_system_prompt += (
            "\n\nЭто КРУПНАЯ задача — сделай максимально насыщенный, детальный и продающий сайт: "
            "больше содержательных секций (6-8), проработанные блоки (преимущества, отзывы, тарифы/каталог, FAQ, форма), "
            "богатая, но аккуратная вёрстка. Всё равно ОБЯЗАТЕЛЬНО закрой все теги и заверши документ на </body></html>."
        )

    payload = json.dumps({
        'model': model_name,
        'messages': [{'role': 'system', 'content': effective_system_prompt}] + chat_messages,
        'max_tokens': max_tokens,
        'temperature': 0.7,
        # Отключаем режим "рассуждения" (reasoning/thinking) — у Gemini 2.5 Flash он включён
        # по умолчанию и тратит много времени на размышления ДО ответа. Для генерации HTML
        # он не нужен — важна скорость выдачи кода. effort=low минимизирует задержку.
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

    # Таймаут внутреннего запроса к OpenRouter вычислен из бюджета функции (ai_timeout).
    # Он ГАРАНТИРОВАННО меньше лимита функции — поэтому если AI отвечает слишком долго,
    # мы САМИ прерываем ожидание, возвращаем списанный запрос (refund_quota) и отдаём
    # понятную ошибку 504, а не получаем жёсткий обрыв функции платформой.
    try:
        with urllib.request.urlopen(req, timeout=ai_timeout) as response:
            result = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        refund_quota(user_id, schema, request_cost)
        return err(f'OpenRouter API error {e.code}', 502)
    except (urllib.error.URLError, TimeoutError, socket.timeout) as e:
        refund_quota(user_id, schema, request_cost)
        # Таймаут ожидания ответа от AI — отдаём 504, фронтенд покажет понятный текст.
        if isinstance(e, urllib.error.URLError) and not isinstance(getattr(e, 'reason', None), (TimeoutError, socket.timeout)):
            return err('OpenRouter API недоступен. Попробуйте позже.', 503)
        return err('AI не успел ответить вовремя. Упростите запрос или выберите другую модель.', 504)
    except (json.JSONDecodeError, Exception):
        refund_quota(user_id, schema, request_cost)
        return err('Неверный ответ от OpenRouter.', 502)

    choices = result.get('choices') or []
    if not choices:
        refund_quota(user_id, schema, request_cost)
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

    # Страховка: если модель всё же оборвала HTML (упёрлась в лимит токенов) — аккуратно
    # закрываем недописанные ключевые теги, чтобы превью не оставалось пустым белым экраном.
    html = repair_truncated_html(html)

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