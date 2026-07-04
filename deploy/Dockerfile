# Образ backend-сервера: запускает все функции из /backend через deploy/server.py
FROM python:3.11-slim

WORKDIR /app

COPY deploy/requirements.txt deploy/requirements.txt
RUN pip install --no-cache-dir -r deploy/requirements.txt

COPY backend/ backend/
COPY deploy/server.py deploy/server.py

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "--chdir", "/app", "deploy.server:app"]
