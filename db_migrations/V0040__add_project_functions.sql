-- Этап 2 фуллстека («Логика/API»): серверные функции проекта.
-- AI генерирует небольшие JS-функции (расчёты, проверки, обработка заявок), которые сайт вызывает
-- через публичный /api/public-fn. Код исполняется в изолированном интерпретаторе (duktape/dukpy)
-- в отдельном процессе со скрабленным окружением и таймаутом — без доступа к ФС, сети, секретам.
CREATE TABLE IF NOT EXISTS project_functions (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id),
  user_id      INTEGER NOT NULL REFERENCES users(id),
  name         VARCHAR(64) NOT NULL,               -- латиница/цифры/подчёркивание, вызывается с сайта
  description  VARCHAR(300),
  code         TEXT NOT NULL,                        -- тело функции handler(input) на JavaScript
  reads        JSONB NOT NULL DEFAULT '[]',          -- имена таблиц проекта, доступных функции на чтение
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);
CREATE INDEX IF NOT EXISTS idx_project_functions_project ON project_functions(project_id);
