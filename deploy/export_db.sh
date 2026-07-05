#!/bin/bash
# Экспорт базы данных проекта для переноса на свой сервер PostgreSQL.
#
# Запускать НЕ на новом VPS, а там, где есть доступ к текущей DATABASE_URL
# (можно попросить в поддержке провайдера временный доступ, либо выполнить
# через любой инструмент, который умеет подключаться к Postgres по DATABASE_URL).
#
# Использование:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname" ./export_db.sh
#
# Результат: файл db_dump.sql с полной схемой (таблицы, индексы, внешние ключи)
# и данными текущей схемы проекта.

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Ошибка: укажите DATABASE_URL, например:"
  echo '  DATABASE_URL="postgresql://user:pass@host:5432/db" ./export_db.sh'
  exit 1
fi

SCHEMA_NAME="${MAIN_DB_SCHEMA:-public}"
OUT_FILE="db_dump.sql"

echo "Экспортируем схему '$SCHEMA_NAME' в $OUT_FILE ..."

pg_dump "$DATABASE_URL" \
  --schema="$SCHEMA_NAME" \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$OUT_FILE"

echo "Готово! Файл $OUT_FILE содержит полную схему + данные."
echo "Перенесите его на новый сервер и выполните:"
echo "  psql \"postgresql://user:pass@localhost:5432/roboweb\" -f db_dump.sql"
