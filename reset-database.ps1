# Скрипт для полной очистки базы данных и пересоздания контейнеров
Write-Host "Останавливаем все контейнеры..." -ForegroundColor Yellow
docker-compose down

Write-Host "Удаляем volumes с данными..." -ForegroundColor Yellow
docker volume rm "project code_postgres_data" -ErrorAction SilentlyContinue

Write-Host "Пересоздаем контейнеры..." -ForegroundColor Green  
docker-compose up -d postgres redis

Write-Host "Ожидаем запуска PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "База данных полностью очищена!" -ForegroundColor Green
Write-Host "Теперь можно запустить сервисы: docker-compose up -d" -ForegroundColor Cyan
