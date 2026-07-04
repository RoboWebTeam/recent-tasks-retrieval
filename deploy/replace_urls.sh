#!/bin/bash
# Автоматическая замена ссылок на backend-функции poehali.dev
# на локальные пути /api/<имя-функции> для работы на своём VPS.
#
# Запускать из корня проекта:
#   chmod +x deploy/replace_urls.sh
#   ./deploy/replace_urls.sh
#
# Скрипт делает замену только в известных файлах, где встречаются ссылки,
# по точным UUID — случайно зацепить лишнее исключено.

set -e

echo "Заменяю ссылки functions.poehali.dev на /api/... "

declare -A URLS=(
  ["1c31dd39-a734-4b06-bc38-a2e25d8ad7cf"]="auth"
  ["2b772da8-0a47-4371-97c7-b0a6834cdf0e"]="user-projects"
  ["86596285-1259-4cdb-8c8d-48a19c6f94df"]="site-files"
  ["2c23b134-6798-4837-b6b2-226e599051f9"]="public-site"
  ["8e970c92-49ad-4f27-9b52-3572f6efc1f6"]="domains"
  ["7aaaa29f-7484-4295-83d3-fbc7eaf6e923"]="project-core"
  ["6a25f90e-ad5e-4f64-abf2-45b6b515b915"]="generate-image"
  ["64b3e52e-6bb5-4d4e-b7ee-e3840af35990"]="generate-site"
  ["b66b5f92-bcdf-4605-87e2-b42e3d90e6ff"]="plan-pricing"
  ["4272fc80-99e8-4abe-8f09-7dce2b50bc57"]="send-email"
  ["30e5ede9-3024-46d5-ad27-eae4b46b0056"]="get-leads"
  ["f00990ba-30f7-4fe5-9cb2-974518f45564"]="manage-user"
  ["ee6777e6-59d0-4d5f-acb2-d292c72253d3"]="analytics"
  ["96a428e9-25c5-47d2-83b1-bdc68f9f8010"]="site-leads"
  ["fa0bbc9f-ff34-4d08-877f-41fdf35d0dee"]="activity-log"
  ["0ddd7998-ad2d-433a-a6ef-5801b4ed059b"]="support-chat"
  ["4fec45e4-aaef-4bc4-ba3c-7a43dfc964bc"]="yookassa-yookassa"
  ["0883717d-f728-467e-b5d2-c91fb10bf3e6"]="order-status"
)

FILES=(
  "src/data/proPlans.ts"
  "src/pages/index/indexData.ts"
  "src/pages/admin/adminTypes.ts"
  "src/lib/auth.ts"
  "src/pages/Analytics.tsx"
  "src/pages/Pricing.tsx"
  "src/pages/Dashboard.tsx"
  "src/pages/OrderStatus.tsx"
  "src/pages/Builder.tsx"
  "src/pages/Leads.tsx"
  "src/components/SupportChatWidget.tsx"
)

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Пропуск (не найден): $file"
    continue
  fi
  for uuid in "${!URLS[@]}"; do
    func="${URLS[$uuid]}"
    sed -i.bak "s|https://functions.poehali.dev/${uuid}|/api/${func}|g" "$file"
  done
  rm -f "${file}.bak"
  echo "Обработан: $file"
done

echo ""
echo "Готово! Проверьте изменения командой:"
echo "  git diff src/"
echo ""
echo "Не забудьте пересобрать фронтенд:"
echo "  npm run build"
