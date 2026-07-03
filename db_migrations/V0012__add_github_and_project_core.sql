-- GitHub OAuth token storage (для публикации репозиториев от имени пользователя)
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_login VARCHAR(100);

-- Привязка проекта к GitHub-репозиторию
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_pages_url TEXT;

-- Секреты проекта (ключи/токены для встроенных интеграций конкретного сайта)
CREATE TABLE IF NOT EXISTS project_secrets (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  key_name VARCHAR(100) NOT NULL,
  key_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, key_name)
);

-- Простая база данных проекта: пользовательские таблицы
CREATE TABLE IF NOT EXISTS project_db_tables (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  table_name VARCHAR(100) NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, table_name)
);

-- Строки пользовательских таблиц
CREATE TABLE IF NOT EXISTS project_db_rows (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES project_db_tables(id),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_secrets_project ON project_secrets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_db_tables_project ON project_db_tables(project_id);
CREATE INDEX IF NOT EXISTS idx_project_db_rows_table ON project_db_rows(table_id);
