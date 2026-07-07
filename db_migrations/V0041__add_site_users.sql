-- Этап 3 фуллстека («Аккаунты»): у каждого сгенерированного сайта — свои посетители-пользователи
-- (отдельные от владельцев RoboWeb). Регистрация/вход на сайте, личный кабинет со своими заказами.
-- Всё строго изолировано по project_id.

-- Пользователи сайта (посетители). Уникальность email — в рамках одного проекта, без учёта регистра.
CREATE TABLE IF NOT EXISTS project_site_users (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id),
  email         VARCHAR(200) NOT NULL,
  password_hash TEXT NOT NULL,
  name          VARCHAR(200),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_users_project_email
  ON project_site_users(project_id, lower(email));

-- Сессии посетителей сайта (токен = secrets.token_urlsafe). Токен привязан к проекту — токен одного
-- сайта не действует на другом.
CREATE TABLE IF NOT EXISTS project_site_sessions (
  token         VARCHAR(64) PRIMARY KEY,
  site_user_id  INTEGER NOT NULL REFERENCES project_site_users(id),
  project_id    INTEGER NOT NULL REFERENCES projects(id),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_sessions_user ON project_site_sessions(site_user_id);

-- Личные строки: у строки может быть владелец-посетитель (личный кабинет). Проставляет ТОЛЬКО сервер.
ALTER TABLE project_db_rows
  ADD COLUMN IF NOT EXISTS owner_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_db_rows_owner ON project_db_rows(table_id, owner_id);

-- Таблица «личных» данных: строки принадлежат посетителю, читаются только им (его личный кабинет).
ALTER TABLE project_db_tables
  ADD COLUMN IF NOT EXISTS owner_scoped BOOLEAN NOT NULL DEFAULT FALSE;
