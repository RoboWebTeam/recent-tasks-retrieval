
CREATE TABLE t_p52543339_recent_tasks_retriev.page_views (
  id         BIGSERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES t_p52543339_recent_tasks_retriev.projects(id),
  site_url   TEXT NOT NULL DEFAULT '',
  path       TEXT NOT NULL DEFAULT '/',
  referrer   TEXT NOT NULL DEFAULT '',
  device     TEXT NOT NULL DEFAULT 'desktop',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_views_project_id ON t_p52543339_recent_tasks_retriev.page_views(project_id);
CREATE INDEX idx_page_views_created_at ON t_p52543339_recent_tasks_retriev.page_views(created_at);
CREATE INDEX idx_page_views_site_url   ON t_p52543339_recent_tasks_retriev.page_views(site_url);

CREATE TABLE t_p52543339_recent_tasks_retriev.site_leads (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES t_p52543339_recent_tasks_retriev.projects(id),
  site_url   TEXT NOT NULL DEFAULT '',
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_leads_project_id ON t_p52543339_recent_tasks_retriev.site_leads(project_id);
CREATE INDEX idx_site_leads_created_at ON t_p52543339_recent_tasks_retriev.site_leads(created_at);
CREATE INDEX idx_site_leads_status     ON t_p52543339_recent_tasks_retriev.site_leads(status);
