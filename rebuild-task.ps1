# Rebuild and restart task-service only
Write-Host "Rebuilding task-service..." -ForegroundColor Yellow
docker compose up -d --build task-service

Write-Host "Done!" -ForegroundColor Green
