CREATE TABLE support_conversations (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(64) NOT NULL,
  user_id INTEGER NULL REFERENCES users(id),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  unread_by_admin BOOLEAN NOT NULL DEFAULT true,
  unread_by_visitor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES support_conversations(id),
  sender VARCHAR(10) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_conversations_visitor ON support_conversations(visitor_id);
CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id);
