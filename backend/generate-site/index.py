import os
import json
import smtplib
import urllib.request
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
9a. КРИТИЧЕСКИ ВАЖНО ПРО ОБЪЁМ И ЦЕЛОСТНОСТЬ (у тебя жёсткий лимит на длину ответа ~5000 токенов):
- Делай ровно 4-5 секций, не больше. Меньше секций — но каждая завершённая.
- CSS пиши очень сжато: минимум правил, короткие селекторы, никаких лишних отступов/комментариев/дублей. Не описывай десятки :hover и media-запросов — только необходимое.
- РАСПРЕДЕЛЯЙ бюджет: обязательно оставь место, чтобы дописать HTML тела и закрыть ВСЕ теги. Документ ДОЛЖЕН заканчиваться на </body></html>.
- Если чувствуешь, что не хватает места — сокращай контент, но НИКОГДА не обрывай документ на середине <style> или тега. Целый короткий сайт лучше длинного оборванного.

ОБЯЗАТЕЛЬНОЕ SEO-оформление <head> (важно для индексации в Яндекс и Google):
10. <html lang="ru"> (или другой язык, если пользователь просит сайт на другом языке)
11. <title> — конкретный, отражающий суть бизнеса/сайта (40-60 символов), без "Roboweb" и общих слов вроде "Главная"
12. <meta name="description" content="..."> — продающее описание сути сайта (120-160 символов), без воды
13. <meta name="viewport" content="width=device-width, initial-scale=1.0">
14. <meta charset="UTF-8">
15. <meta property="og:title">, <meta property="og:description">, <meta property="og:type" content="website"> — синхронизированы с title/description
16. Если на сайте есть подходящее изображение (логотип, hero-картинка) — добавь <meta property="og:image" content="...">
17. Один <h1> на странице, отражающий главный оффер, остальные заголовки — <h2>/<h3> по иерархии

ОБЯЗАТЕЛЬНО: В САМОМ НАЧАЛЕ ответа, ПЕРЕД <!DOCTYPE html>, добавь ОДНУ строку — служебный блок метаданных строго в таком формате (валидный JSON в одну строку, экранируй кавычки):
<!--ROBOWEB_META:{"intro":"...","summary":"...","steps":["..."],"design":"...","sections":["..."],"suggestions":[{"icon":"Star","label":"...","prompt":"..."}]}-->
Заполни ПОДРОБНО и живо, от первого лица, на языке пользователя, как будто ты — веб-разработчик, который лично рассказывает клиенту о проделанной работе. Не будь сухим, но и без воды:
- intro — 1 предложение: как ты понял задачу и что решил сделать (например: "Понял — нужен продающий лендинг для кофейни, который вызывает аппетит и мотивирует зайти. Взялся за дело!").
- summary — 2-3 предложения: что в итоге получилось, общее впечатление от сайта.
- steps — массив из 4-6 пунктов о том, что КОНКРЕТНО ты сделал по ходу работы. Каждый пункт — живое действие с деталями. Если это ПРАВКА существующего сайта — опиши что нашёл, что именно изменил/исправил/улучшил (например: "Нашёл, что кнопка заказа терялась на фоне — сделал её ярко-оранжевой и крупнее", "Добавил секцию с отзывами клиентов и звёздным рейтингом"). Если создаёшь с нуля — опиши процесс сборки (например: "Собрал структуру: шапка, hero, меню, отзывы, контакты", "Подобрал тёплую бежево-коричневую палитру под уют кофейни", "Добавил плавные анимации появления блоков при прокрутке").
- design — 1 предложение про дизайн-решения: палитра, шрифты, стиль (например: "Использовал шрифт Playfair Display для заголовков и тёплую палитру #6F4E37, чтобы передать атмосферу кофе.").
- sections — массив из 3-6 коротких названий секций сайта.
- suggestions — массив из 3-4 УМЕСТНЫХ именно для этого сайта идей улучшений. Каждая: icon (имя иконки lucide: Star, Phone, Calendar, MessageSquare, MapPin, ShoppingCart, Image, Users, Award, Mail, CreditCard, Clock), label (2-4 слова, что добавить), prompt (готовая команда для меня). Предлагай функциональные вещи под тип сайта: онлайн-запись, форма заявки, галерея, блок цен, отзывы, карта, FAQ и т.п.
Сразу после этой строки идёт <!DOCTYPE html> и далее полный HTML-документ. Этот блок — служебный, НЕ часть видимой страницы. Больше никакого текста и markdown."""

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

def check_and_consume_quota(user_id: int, schema: str):
    """Проверяет лимит AI-запросов (тариф + энергия) и списывает один запрос.
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

            if used < limit:
                cur.execute(f"UPDATE {schema}.users SET requests_used = requests_used + 1 WHERE id = %s", (user_id,))
                conn.commit()
                return True, None, (limit - used - 1) + energy

            if energy > 0:
                cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance - 1 WHERE id = %s", (user_id,))
                conn.commit()
                return True, None, energy - 1

            conn.commit()
            return False, 'Лимит AI-запросов исчерпан. Пополните энергию или смените тариф.', 0
    finally:
        conn.close()

def refund_quota(user_id: int, schema: str):
    """Возвращает списанный запрос, если обращение к AI не удалось (таймаут, ошибка модели и т.п.).
    Пользователь не должен терять запрос из своего лимита, если сайт не был сгенерирован.
    Порядок восстановления зеркален списанию: сначала энергия, затем лимит тарифа —
    так же, как FILO/LIFO для check_and_consume_quota (energy списывается только когда лимит уже исчерпан)."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT requests_used, requests_limit FROM {schema}.users WHERE id = %s FOR UPDATE",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return
            used, limit = row
            if used > 0:
                cur.execute(f"UPDATE {schema}.users SET requests_used = requests_used - 1 WHERE id = %s", (user_id,))
            else:
                cur.execute(f"UPDATE {schema}.users SET energy_balance = energy_balance + 1 WHERE id = %s", (user_id,))
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
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
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
    m = re.search(r'<!--\s*ROBOWEB_META:(\{.*?\})\s*-->', html, re.DOTALL)
    if m:
        try:
            parsed = json.loads(m.group(1))
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

    allowed, quota_error, remaining = check_and_consume_quota(user_id, schema)
    if not allowed:
        maybe_notify_low_balance(user_id, 0, schema)
        return err(quota_error, 402)

    maybe_notify_low_balance(user_id, remaining, schema)

    body = json.loads(event.get('body') or '{}')
    messages = body.get('messages', [])
    project_id = body.get('project_id')
    model_choice = body.get('model', 'claude')
    current_html = body.get('current_html', '')

    if not messages:
        return err('Нет сообщений')

    project_images = get_project_images(project_id, user_id, schema)
    system_prompt = build_system_prompt(project_images)

    # Обрезаем последнюю команду пользователя на случай, если вставлен огромный текст/код
    MAX_MESSAGE_CHARS = 6000
    last_user_content = (messages[-1].get('content', '') or '')[:MAX_MESSAGE_CHARS]

    # КЛЮЧЕВОЙ МОМЕНТ: если сайт уже сгенерирован ранее — это ПРАВКА существующего кода.
    # Передаём модели текущий HTML напрямую + только новую команду, вместо всей истории чата.
    # Это одинаково важно для всех моделей (Claude/GPT-4o/Gemini):
    #   1) Модель видит реальный текущий код и точно знает, что менять — правки не "теряются"
    #      и не переписывают весь сайт заново по догадке
    #   2) Запрос остаётся компактным независимо от длины переписки — не растёт с каждой правкой,
    #      что радикально снижает время ответа и риск таймаута на длинных диалогах
    MAX_HTML_CHARS = 40000
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
        MAX_HISTORY_MESSAGES = 8
        trimmed = messages if len(messages) <= MAX_HISTORY_MESSAGES else [messages[0]] + messages[-(MAX_HISTORY_MESSAGES - 1):]
        chat_messages = [
            {'role': m.get('role', 'user'), 'content': (m.get('content', '') or '')[:MAX_MESSAGE_CHARS]}
            for m in trimmed
        ]

    # Используем БЫСТРЫЕ версии моделей: полноценный сайт должен успеть сгенерироваться
    # в пределах лимита времени облачной функции (~30 сек). Топовые модели (sonnet-4.5,
    # gemini-2.5-pro) слишком медленные для одностраничной генерации и упираются в таймаут.
    # Быстрые варианты дают отличное качество для лендингов/визиток за 5-15 секунд.
    OPENROUTER_MODELS = {
        'gpt-4o': 'openai/gpt-4o-mini',
        'claude': 'anthropic/claude-haiku-4.5',
        'gemini': 'google/gemini-2.5-flash',
    }
    model_name = OPENROUTER_MODELS.get(model_choice, OPENROUTER_MODELS['gemini'])

    api_key = os.environ.get('OPENROUTER_API_KEY', '')
    if not api_key:
        return err('OpenRouter API ключ не настроен')

    payload = json.dumps({
        'model': model_name,
        'messages': [{'role': 'system', 'content': system_prompt}] + chat_messages,
        # Лимит длины ответа. Больше 5000 — модель не укладывается в 30-сек лимит функции
        # (таймаут). Поэтому держим 5000 и через промпт требуем компактный, но ПОЛНЫЙ сайт;
        # на случай обрыва есть страховка repair_truncated_html, закрывающая теги.
        'max_tokens': 5000,
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

    # Таймаут внутреннего запроса к OpenRouter — 22 сек, чтобы гарантированно оставить
    # время на сохранение результата в БД и корректный ответ до 30-секундного лимита самой
    # облачной функции. Если ответ не пришёл за 22 сек — вернём понятную ошибку и вернём запрос.
    try:
        with urllib.request.urlopen(req, timeout=22) as response:
            result = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        refund_quota(user_id, schema)
        return err(f'OpenRouter API error {e.code}', 502)
    except urllib.error.URLError:
        refund_quota(user_id, schema)
        return err('OpenRouter API недоступен. Попробуйте позже.', 503)
    except (json.JSONDecodeError, Exception):
        refund_quota(user_id, schema)
        return err('Неверный ответ от OpenRouter.', 502)

    choices = result.get('choices') or []
    if not choices:
        refund_quota(user_id, schema)
        return err('AI вернул пустой ответ.', 502)

    html = (choices[0].get('message', {}).get('content') or '').strip()
    if not html:
        refund_quota(user_id, schema)
        return err('AI вернул пустой HTML.', 502)

    usage = result.get('usage', {})
    tokens = usage.get('prompt_tokens', 0) + usage.get('completion_tokens', 0)

    # Сначала извлекаем служебный блок метаданных (описание + предложения) и убираем его из HTML.
    # Делаем это ДО очистки markdown, т.к. блок стоит в начале ответа и не должен пострадать.
    html, meta = extract_meta_block(html)

    # Убираем markdown-обёртку если есть
    html = html.strip()
    if html.startswith('```'):
        lines = html.split('\n')
        html = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])

    # Страховка: если модель всё же оборвала HTML (упёрлась в лимит токенов) — аккуратно
    # закрываем недописанные ключевые теги, чтобы превью не оставалось пустым белым экраном.
    html = repair_truncated_html(html)

    # Сохраняем HTML в проект если передан project_id
    if project_id:
        save_html(int(project_id), html, schema)

    return ok({
        'html': html,
        'tokens': tokens,
        'remaining': remaining,
        'intro': meta.get('intro', ''),
        'summary': meta.get('summary', ''),
        'steps': meta.get('steps', []),
        'design': meta.get('design', ''),
        'sections': meta.get('sections', []),
        'suggestions': meta.get('suggestions', []),
    })