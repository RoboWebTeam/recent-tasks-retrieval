# Технологический стек и API проекта

## Frontend

- **React 18** + **TypeScript** — основной фреймворк
- **Vite** (rolldown-vite) — сборщик и dev-сервер
- **Tailwind CSS** — стилизация
- **shadcn/ui** (на базе **Radix UI**) — библиотека UI-компонентов
- **React Router DOM** — маршрутизация между страницами
- **React Hook Form** + **Zod** — формы и валидация данных
- **TanStack Query** — загрузка и кеширование данных
- **Recharts** — графики и визуализация аналитики
- **Lucide React** — иконки
- **date-fns** — работа с датами
- **Sonner** — уведомления (toast)
- **cmdk**, **embla-carousel-react**, **vaul**, **input-otp** — вспомогательные UI-компоненты
- **next-themes** — переключение светлой/тёмной темы

## Backend

- **Python 3.11** — облачные функции (serverless, каждая функция — независимый сервис)
- **PostgreSQL** — основная реляционная база данных (доступ через psycopg2, Simple Query Protocol)
- **S3-совместимое хранилище** (boto3) — хранение файлов и изображений, раздаётся через CDN

## Backend-функции (внутренний API)

| Функция | Назначение |
|---|---|
| `auth` | Регистрация, вход, управление сессиями |
| `generate-site` | Генерация и правка сайтов через ИИ (OpenRouter) |
| `generate-image` | Генерация изображений |
| `project-core` | Основная логика проекта/сайта |
| `user-projects` | Управление проектами пользователя |
| `site-files` | Работа с файлами сайта (загрузка/хранение в S3) |
| `site-leads` / `get-leads` | Заявки, оставленные на сайтах клиентов |
| `domains` / `verify-domain` | Подключение и верификация собственных доменов |
| `github-publish` | Публикация кода проекта в GitHub |
| `public-site` | Отдача опубликованных сайтов конечным посетителям |
| `plan-pricing` / `energy-pricing` | Тарифы и стоимость AI-запросов |
| `order-status` | Статус заказов и оплаты |
| `send-email` | Отправка писем (SMTP) |
| `support-chat` | Чат технической поддержки |
| `analytics` | Аналитика посещений сайтов |
| `activity-log` | Журнал действий пользователей |
| `manage-user` | Администрирование пользователей (админ-панель) |
| `blog-rss` | RSS-лента блога |
| `extensions/yookassa/yookassa` | Создание платежа ЮKassa |
| `extensions/yookassa/yookassa-webhook` | Обработка уведомлений об оплате от ЮKassa |

## Внешние сервисы и интеграции

- **OpenRouter API** — доступ к ИИ-моделям (Claude, Gemini, GPT-4o) для генерации и правки сайтов
- **ЮKassa** — приём онлайн-платежей (с формированием чеков по 54-ФЗ)
- **Яндекс SMTP** (smtp.yandex.ru) — отправка транзакционных писем
- **GitHub OAuth** — авторизация пользователей и выгрузка кода проекта в репозиторий
- **Яндекс OAuth** (Yandex ID) — авторизация пользователей

## База данных — основные таблицы

Схема PostgreSQL включает таблицы: `users`, `sessions`, `projects`, `orders`, `order_items`, `site_files`, `site_leads`, `leads`, `domains`, `activity_log`, `analytics/page_views`, `plan_pricing`, `energy_pricing`, `energy_packages`, `support_conversations`, `support_messages`, `support_quick_replies`, `support_settings`, `admin_notifications`, `project_db_tables`, `project_db_rows`, `project_secrets`.
