
CREATE TABLE t_p52543339_recent_tasks_retriev.activity_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES t_p52543339_recent_tasks_retriev.users(id),
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL DEFAULT '',
  entity_id  INTEGER,
  meta       TEXT NOT NULL DEFAULT '{}',
  ip         TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_id    ON t_p52543339_recent_tasks_retriev.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON t_p52543339_recent_tasks_retriev.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action     ON t_p52543339_recent_tasks_retriev.activity_log(action);

CREATE TABLE t_p52543339_recent_tasks_retriev.admin_notifications (
  id         SERIAL PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  link       TEXT NOT NULL DEFAULT '',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notif_created_at ON t_p52543339_recent_tasks_retriev.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notif_is_read    ON t_p52543339_recent_tasks_retriev.admin_notifications(is_read);
