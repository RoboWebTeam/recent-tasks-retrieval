# Технологический стек и интеграции проекта

См. также: [GUIDE.md](./GUIDE.md) — инструкция по запуску и управлению, [ARCHITECTURE.md](./ARCHITECTURE.md) — полная бизнес-логика и архитектура.

## Frontend

- **React 18** + **TypeScript** — основной фреймворк
- **Vite** (rolldown-vite) — сборщик и dev-сервер
- **Tailwind CSS** — стилизация, цвета заданы CSS-переменными в `src/index.css`
- **shadcn/ui** (на базе **Radix UI**) — библиотека UI-компонентов (`src/components/ui`)
- **React Router DOM** — маршрутизация между страницами (`src/App.tsx`)
- **React Hook Form** + **Zod** — формы и валидация данных
- **TanStack Query** — загрузка и кеширование данных
- **Recharts** — графики и визуализация аналитики
- **Lucide React** — иконки (использовать только через обёртку `<Icon name="..." />`, не импортировать напрямую)
- **date-fns** — работа с датами
- **Sonner** — уведомления (toast)
- **cmdk**, **embla-carousel-react**, **vaul**, **input-otp** — вспомогательные UI-компоненты
- **next-themes** — переключение светлой/тёмной темы

## Backend

- **Python 3.11** — облачные функции (serverless, каждая папка в `/backend/*` — независимый сервис со своей точкой входа `handler(event, context)`)
- **PostgreSQL** — основная реляционная база данных (доступ через `psycopg2`, Simple Query Protocol — без extended query/параметризованных запросов)
- **boto3** — работа с S3-совместимыми хранилищами (см. раздел «Хранилище файлов» ниже)

## Backend-функции (внутренний API)

| Функция | Назначение |
|---|---|
| `auth` | Регистрация, вход, OAuth, управление сессиями |
| `generate-site` | Генерация и правка сайтов через Claude Sonnet 5 (прямой Anthropic API) |
| `project-core` | «Ядро» проекта: секреты, пользовательская мини-БД, файлы, функции |
| `user-projects` | CRUD проектов пользователя |
| `site-files` | Загрузка/хранение файлов сайта (в S3 на reg.ru) |
| `site-leads` / `get-leads` | Заявки, оставленные на сайтах клиентов / email-подписчики |
| `domains` / `verify-domain` | Подключение и верификация собственных доменов |
| `github-publish` | Публикация кода проекта в GitHub Pages |
| `public-site` | Отдача опубликованных сайтов конечным посетителям |
| `plan-pricing` / `energy-pricing` | Тарифы и стоимость AI-запросов |
| `order-status` | Статус заказов и оплаты |
| `send-email` | Отправка писем (SMTP) |
| `support-chat` | Чат технической поддержки |
| `analytics` | Аналитика посещений сайтов |
| `activity-log` | Журнал действий пользователей |
| `manage-user` | Администрирование пользователей (админ-панель) |
| `blog-rss` | RSS-лента блога (для Яндекс.Дзен) |
| `extensions/yookassa/yookassa` | Создание платежа ЮKassa |
| `extensions/yookassa/yookassa-webhook` | Обработка уведомлений об оплате от ЮKassa |

## Внешние сервисы и интеграции

- **Anthropic API (Claude Sonnet 5)** — прямая генерация и правка HTML сайтов, без посредников
- **ЮKassa** — приём онлайн-платежей (с формированием чеков по 54-ФЗ)
- **Яндекс SMTP** (smtp.yandex.ru) — отправка транзакционных писем
- **GitHub OAuth** — авторизация пользователей и выгрузка кода проекта в репозиторий (GitHub Pages)
- **Яндекс OAuth** (Yandex ID) — авторизация пользователей
- **Google DNS-over-HTTPS** — верификация DNS-записей (A/CNAME) при подключении собственного домена

## Хранилище файлов (S3) — два независимых источника

1. **reg.ru (Рег.облако)** — основное хранилище для ВСЕХ новых данных: endpoint `https://s3.regru.cloud`, bucket `roboweb`. Используется функциями `site-files` (файлы пользователей) и `support-chat` (вложения чата поддержки). Требует `ACL='public-read'` при каждой загрузке — иначе прямая ссылка на файл возвращает 403.
2. **Встроенное S3 платформы** (endpoint `bucket.poehali.dev`) — легаси, используется только для уже существующих статических картинок (обложки блога, примеры портфолио на главной странице). Новые файлы туда не пишутся.

## База данных — основные таблицы

Схема PostgreSQL включает таблицы: `users`, `sessions`, `projects` (с `html_content` — весь HTML сайта хранится как текст), `orders`, `order_items`, `site_files`, `site_leads`, `leads`, `domains`, `activity_log`, `page_views`, `plan_pricing`, `energy_pricing`, `energy_packages`, `support_conversations`, `support_messages`, `support_quick_replies`, `support_settings`, `admin_notifications`, `project_db_tables`, `project_db_rows`, `project_secrets`.

Подробное описание назначения каждой таблицы — в [ARCHITECTURE.md](./ARCHITECTURE.md#6-база-данных--ключевые-таблицы).
