-- Заявки на сброс пароля. Решение принимает владелец по кнопке в Telegram (SMTP на VPS
-- недоступен — см. backend/send-email), поэтому это не токен-по-почте, а запрос-подтверждение:
-- пользователь остаётся на той же странице и ждёт одобрения (poll), как в demo-access у других
-- продуктов студии.
CREATE TABLE IF NOT EXISTS t_p52543339_recent_tasks_retriev.password_reset_requests (
  id          TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES t_p52543339_recent_tasks_retriev.users(id),
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | used
  ip          TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at  TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
);

CREATE INDEX IF NOT EXISTS idx_pwreset_user ON t_p52543339_recent_tasks_retriev.password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pwreset_status ON t_p52543339_recent_tasks_retriev.password_reset_requests(status);
