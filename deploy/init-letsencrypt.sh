#!/bin/sh
# Выпуск настоящего Let's Encrypt-сертификата для roboweb.dev.
# Запускать ПОСЛЕ того, как DNS домена резолвится на этот сервер (иначе HTTP-01 валидация не пройдёт):
#   getent hosts roboweb.dev   # должен показать IP сервера
# Использование (из папки deploy):  LE_EMAIL=you@example.com sh init-letsencrypt.sh
# Идемпотентно: можно перезапускать.
set -e
cd "$(dirname "$0")"

DOMAIN_ARGS="-d roboweb.dev -d www.roboweb.dev"
if [ -n "$LE_EMAIL" ]; then EMAIL_ARG="--email $LE_EMAIL"; else EMAIL_ARG="--register-unsafely-without-email"; fi

echo "[1/4] Поднимаю стек (nginx стартует с dummy-сертификатом, ACME-путь доступен)…"
docker compose up -d

echo "[2/4] Удаляю dummy-сертификат roboweb.dev, чтобы certbot создал чистую линию…"
docker compose run --rm --entrypoint sh certbot -c \
  'rm -rf /etc/letsencrypt/live/roboweb.dev /etc/letsencrypt/archive/roboweb.dev /etc/letsencrypt/renewal/roboweb.dev.conf' || true

echo "[3/4] Запрашиваю сертификат Let's Encrypt (webroot-челлендж)…"
if docker compose run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot $DOMAIN_ARGS $EMAIL_ARG \
    --agree-tos --no-eff-email --non-interactive; then
  echo "[4/4] Перезагружаю nginx с настоящим сертификатом…"
  docker compose exec frontend nginx -s reload || docker compose restart frontend
  echo "Готово ✅  HTTPS активен: https://roboweb.dev"
else
  echo "certbot не смог выпустить сертификат (проверьте, что DNS roboweb.dev → этот сервер)."
  echo "Восстанавливаю dummy-сертификат, чтобы nginx не упал…"
  docker compose up -d --force-recreate --no-deps certbot-init
  docker compose restart frontend
  exit 1
fi
