CREATE TABLE IF NOT EXISTS site_files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  file_name VARCHAR(255) NOT NULL,
  file_key VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_files_user_id ON site_files(user_id);
CREATE INDEX IF NOT EXISTS idx_site_files_project_id ON site_files(project_id);