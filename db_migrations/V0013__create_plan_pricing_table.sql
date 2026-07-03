CREATE TABLE IF NOT EXISTS plan_pricing (
  id SERIAL PRIMARY KEY,
  plan_code VARCHAR(20) NOT NULL UNIQUE,
  requests INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plan_pricing (plan_code, requests, price, sort_order)
SELECT * FROM (VALUES
  ('pro_60', 60, 2999.00, 1),
  ('pro_80', 80, 4999.00, 2),
  ('pro_200', 200, 9999.00, 3),
  ('pro_400', 400, 19999.00, 4),
  ('pro_800', 800, 49999.00, 5)
) AS v(plan_code, requests, price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM plan_pricing);
