CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  project_id INTEGER REFERENCES projects(id),
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  redirect_mode VARCHAR(20) NOT NULL DEFAULT 'none',
  ssl_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ssl_issued_at TIMESTAMPTZ,
  ssl_expires_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_project_id ON domains(project_id);
