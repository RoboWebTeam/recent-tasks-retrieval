ALTER TABLE users
  ADD COLUMN IF NOT EXISTS requests_limit INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS requests_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requests_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS energy_balance INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS energy_packages (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  requests INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

INSERT INTO energy_packages (code, requests, price)
SELECT * FROM (VALUES
  ('small', 10, 290.00),
  ('medium', 30, 690.00),
  ('large', 100, 1990.00)
) AS v(code, requests, price)
WHERE NOT EXISTS (SELECT 1 FROM energy_packages);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'plan',
  ADD COLUMN IF NOT EXISTS energy_amount INTEGER;
