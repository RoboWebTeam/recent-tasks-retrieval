# Образ backend-сервера: запускает все функции из /backend через deploy/server.py
FROM python:3.11-slim

WORKDIR /app

COPY deploy/requirements.txt deploy/requirements.txt
RUN pip install --no-cache-dir -r deploy/requirements.txt

COPY backend/ backend/
COPY deploy/server.py deploy/server.py

EXPOSE 8000

# gthread-воркеры + потоки: долгий SSE-стрим генерации (лайв-сборка сайта) держит
# соединение открытым десятки секунд; на sync-воркерах это заняло бы 1 из 4 процессов
# целиком и морило бы остальные запросы. gthread обслуживает много запросов на воркер.
CMD ["gunicorn", "-w", "4", "-k", "gthread", "--threads", "16", "-b", "0.0.0.0:8000", "--chdir", "/app", "deploy.server:app"]
