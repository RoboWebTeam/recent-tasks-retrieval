-- Этап 1 фуллстека («Данные»): флаги публичного доступа для виртуальных таблиц проекта.
-- AI при генерации сайта объявляет таблицы маркером ROBOWEB_SCHEMA; часть из них должна быть
-- доступна публичному data-API (backend/public-data): каталоги — на чтение, формы — на запись.
-- По умолчанию ВСЕ таблицы приватны (FALSE) — публичность включается только явным флагом из схемы,
-- поэтому существующие таблицы, созданные вручную через Ядро, остаются закрытыми.
ALTER TABLE project_db_tables
  ADD COLUMN IF NOT EXISTS public_read  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_write BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS write_fields JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS label        VARCHAR(200);
