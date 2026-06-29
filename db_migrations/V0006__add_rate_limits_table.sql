
CREATE TABLE t_p52543339_recent_tasks_retriev.rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  key        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_key        ON t_p52543339_recent_tasks_retriev.rate_limits(key);
CREATE INDEX idx_rate_limits_created_at ON t_p52543339_recent_tasks_retriev.rate_limits(created_at);
