# Rebuild and restart Docker containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker compose down

Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker compose up -d --build

Write-Host "Done!" -ForegroundColor Green
