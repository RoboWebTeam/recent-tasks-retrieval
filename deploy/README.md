# Перенос проекта Roboweb на свой VPS (reg.ru)

Этот проект сейчас работает на платформе poehali.dev, где:
- **Frontend** — статические файлы (React+Vite сборка)
- **Backend** — Python Cloud Functions (каждая папка в `/backend/*` — отдельная функция, вызываемая по своему URL `https://functions.poehali.dev/...`)
- **База данных** — управляемый PostgreSQL
- **Файлы пользователей** — S3-совместимое хранилище

На голом VPS всей этой инфраструктуры нет "из коробки" — её нужно поднять самостоятельно. Ниже пошаговый план.

---

## Шаг 0. Что подготовлено в папке `/deploy`

| Файл | Назначение |
|---|---|
| `server.py` | Flask-обёртка, которая запускает ВСЕ backend-функции (`/backend/*/index.py`) как обычные HTTP-роуты `/api/<имя-функции>`, без переписывания самого кода функций |
| `requirements.txt` | Единый список Python-зависимостей для всех функций |
| `export_db.sh` | Скрипт экспорта текущей базы данных в `db_dump.sql` |

---

## Шаг 1. Сервер: базовая настройка (Ubuntu 22.04 на VPS reg.ru)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-pip postgresql postgresql-contrib nginx git
```

## Шаг 2. PostgreSQL

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE roboweb;
CREATE USER roboweb_user WITH PASSWORD 'придумайте-надёжный-пароль';
GRANT ALL PRIVILEGES ON DATABASE roboweb TO roboweb_user;
\q
```

### Перенос данных
1. Экспортируйте текущую БД (выполняется там, где есть доступ к текущему `DATABASE_URL` проекта):
   ```bash
   DATABASE_URL="<текущий DATABASE_URL из секретов проекта>" ./deploy/export_db.sh
   ```
   Получится файл `db_dump.sql`.
2. Скопируйте `db_dump.sql` на новый сервер и загрузите:
   ```bash
   psql "postgresql://roboweb_user:пароль@localhost:5432/roboweb" -f db_dump.sql
   ```

⚠️ Обратите внимание: текущая схема в БД называется не `public`, а специфичным именем вида `t_p52543339_...`. После переноса либо оставьте это же имя схемы и пропишите его в `MAIN_DB_SCHEMA`, либо переименуйте схему на `public`:
```sql
ALTER SCHEMA t_p52543339_recent_tasks_retriev RENAME TO public;
```
(если `public` уже существует и пуста — сначала удалите её: `DROP SCHEMA public CASCADE;`)

## Шаг 3. Backend

```bash
git clone <ваш-репозиторий> /var/www/roboweb
cd /var/www/roboweb
python3 -m venv venv
source venv/bin/activate
pip install -r deploy/requirements.txt
```

### Переменные окружения
Создайте файл `/var/www/roboweb/.env` (или пропишите в systemd-юните ниже):
```
DATABASE_URL=postgresql://roboweb_user:пароль@localhost:5432/roboweb
MAIN_DB_SCHEMA=public
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
SMTP_PASSWORD=...
TELEGRAM_BOT_TOKEN=...
YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
ADMIN_KEY=...
```
Все значения — те же самые, что сейчас в разделе **Секреты** проекта на poehali.dev (переменные не показываются напрямую — их нужно взять из своих записей/переписать заново, если не сохраняли).

### Проверка локально
```bash
source venv/bin/activate
export $(cat .env | xargs)
python deploy/server.py
# Откройте http://<ip-сервера>:8000/api/health — должен вернуть список функций
```

### Systemd-сервис (чтобы работало постоянно)
Создайте `/etc/systemd/system/roboweb-backend.service`:
```ini
[Unit]
Description=Roboweb backend
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/roboweb
EnvironmentFile=/var/www/roboweb/.env
ExecStart=/var/www/roboweb/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 deploy.server:app
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now roboweb-backend
```

## Шаг 4. Frontend — сборка

Все адреса backend-функций теперь берутся из единого файла `src/lib/apiConfig.ts`.
По умолчанию (без дополнительных настроек) фронтенд обращается к облачным функциям
poehali.dev — это значит, что **текущий сайт на poehali.dev продолжает работать
без изменений**.

Чтобы при сборке для VPS фронтенд обращался к вашему серверу вместо облака,
задайте переменную окружения `VITE_API_BASE_URL` перед сборкой:

```bash
npm install
VITE_API_BASE_URL=https://roboweb.site npm run build
```

Тогда все запросы автоматически пойдут на `https://roboweb.site/api/<имя-функции>`
(соответствие имён функций и путей — в `backend/func2url.json`, роутинг настроен
в `deploy/server.py`).

Получится папка `dist/` — это готовая статика для nginx.

⚠️ Один и тот же билд не может одновременно работать и на poehali.dev, и на VPS —
переменная задаётся один раз перед конкретной сборкой.

## Шаг 5. Nginx

```nginx
server {
    listen 80;
    server_name roboweb.site www.roboweb.site;

    root /var/www/roboweb/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri /index.html;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/roboweb /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Для HTTPS — Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d roboweb.site -d www.roboweb.site
```

## Шаг 6. Файловое хранилище (S3)

Сейчас файлы (картинки, HTML-сайты пользователей) хранятся в S3-совместимом бакете
(`bucket.poehali.dev`). Варианты после переноса:
- **Оставить как есть** — S3-хранилище можно продолжать использовать (это отдельный сервис, не привязанный к самой платформе), если у вас есть свои ключи `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` для него.
- **Перенести на свой S3-совместимый сервис** (Selectel, Yandex Object Storage, MinIO на том же VPS) — тогда в backend-функциях `site-files`, `generate-image`, `support-chat` нужно поменять `endpoint_url` на новый.

## Шаг 7. Внешние интеграции — проверить домены/redirect URI

У OAuth-провайдеров (GitHub, Яндекс, Telegram) прописан callback URL на текущий домен.
После переноса на новый сервер (если домен останется тот же — `roboweb.site`, ничего менять не надо; если домен меняется — обновите redirect URI в настройках каждого приложения):
- GitHub OAuth App → Authorization callback URL
- Яндекс OAuth → Redirect URI
- Telegram @BotFather → `/setdomain`
- ЮKassa → URL уведомлений (webhook)

---

## Итоговый чек-лист

- [ ] PostgreSQL установлен, база восстановлена из дампа
- [ ] Backend запущен через gunicorn + systemd, отвечает на `/api/health`
- [ ] Все секреты прописаны в `.env`
- [ ] Ссылки на backend во фронтенде заменены с `functions.poehali.dev` на `/api/...`
- [ ] Фронтенд собран (`npm run build`) и отдаётся через nginx
- [ ] HTTPS настроен через certbot
- [ ] OAuth redirect URI обновлены при необходимости
- [ ] Проверена регистрация, вход, генерация сайта, публикация, оплата