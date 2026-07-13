-- Персистентный лог расхода токенов по каждой генерации — для факт-калибровки юнит-экономики.
-- До этого расход писался только в stdout (RW_GEN_METRIC) и не агрегировался. Таблица даёт
-- реальный микс моделей (Sonnet/Opus) и размеров (обычная/крупная), долю попаданий в кэш промпта
-- и фактическую себестоимость — чтобы после первых оплат откалибровать маржу и лимиты по факту,
-- а не по модельным допущениям. Пишется идемпотентно после каждой успешной генерации; сбой записи
-- метрики НИКОГДА не влияет на саму генерацию (ошибки проглатываются в коде).
CREATE TABLE IF NOT EXISTS generation_metrics (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      INTEGER,
  project_id   INTEGER,
  model        VARCHAR(40) NOT NULL,
  is_large     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_edit      BOOLEAN     NOT NULL DEFAULT FALSE,
  stream       BOOLEAN     NOT NULL DEFAULT FALSE,
  in_tokens    INTEGER     NOT NULL DEFAULT 0,
  out_tokens   INTEGER     NOT NULL DEFAULT 0,
  cache_read   INTEGER     NOT NULL DEFAULT 0,
  cache_write  INTEGER     NOT NULL DEFAULT 0,
  cost_units   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_metrics_created ON generation_metrics (created_at);
CREATE INDEX IF NOT EXISTS idx_generation_metrics_model   ON generation_metrics (model);
