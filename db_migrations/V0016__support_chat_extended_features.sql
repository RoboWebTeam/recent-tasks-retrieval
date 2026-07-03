ALTER TABLE support_messages ADD COLUMN file_url TEXT NULL;
ALTER TABLE support_messages ADD COLUMN file_type VARCHAR(10) NULL;
ALTER TABLE support_messages ADD COLUMN file_name TEXT NULL;

CREATE TABLE support_quick_replies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO support_settings (key, value) VALUES
  ('auto_reply_enabled', 'false'),
  ('auto_reply_text', 'Спасибо за сообщение! Мы отвечаем с 9:00 до 20:00 по МСК, скоро ответим.'),
  ('work_start_hour', '9'),
  ('work_end_hour', '20');
