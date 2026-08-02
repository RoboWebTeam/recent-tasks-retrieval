# Собирает React-фронтенд и раздаёт его через nginx с проксированием /api на backend.
FROM node:20-alpine AS build

# Chromium нужен на этапе сборки для пререндера публичных страниц: приложение одностраничное,
# и без пререндера поисковик получает пустой каркас без единого слова текста. Ставим системный
# chromium — бандл, который puppeteer качает сам, в alpine не запускается (musl вместо glibc).
# В финальный образ этот слой не попадает: раздачей занимается отдельная стадия на nginx.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package.json bun.lockb* package-lock.json* ./
RUN npm install

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# Проверяем конфиг на этапе сборки образа: синтаксическая ошибка не должна доезжать до прода
# и валить контейнер уже при запуске.
RUN nginx -t
EXPOSE 80
