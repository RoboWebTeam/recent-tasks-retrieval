CREATE TABLE IF NOT EXISTS energy_pricing (
  id SERIAL PRIMARY KEY,
  package_code VARCHAR(20) NOT NULL UNIQUE,
  requests INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO energy_pricing (package_code, requests, price, sort_order)
SELECT * FROM (VALUES
  ('small', 20, 500.00, 1),
  ('medium', 40, 1000.00, 2),
  ('large', 100, 2500.00, 3),
  ('xlarge', 200, 5000.00, 4)
) AS v(package_code, requests, price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM energy_pricing);