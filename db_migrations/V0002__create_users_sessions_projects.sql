CREATE TABLE IF NOT EXISTS t_p52543339_recent_tasks_retriev.users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_color TEXT NOT NULL DEFAULT '#4f6ef7',
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p52543339_recent_tasks_retriev.sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p52543339_recent_tasks_retriev.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS t_p52543339_recent_tasks_retriev.projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p52543339_recent_tasks_retriev.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON t_p52543339_recent_tasks_retriev.sessions(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON t_p52543339_recent_tasks_retriev.projects(user_id);