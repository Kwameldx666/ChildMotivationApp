Write-Host "Stopping auth-service..."
docker-compose -f "c:\Users\Kwameldx666\Desktop\Education\дипломная работа\project code\docker-compose.yml" stop auth-service

Write-Host "`nBuilding auth-service..."
docker-compose -f "c:\Users\Kwameldx666\Desktop\Education\дипломная работа\project code\docker-compose.yml" build auth-service

Write-Host "`nStarting auth-service..."
docker-compose -f "c:\Users\Kwameldx666\Desktop\Education\дипломная работа\project code\docker-compose.yml" up -d auth-service

Write-Host "`nWaiting for service to start (30 seconds)..."
Start-Sleep -Seconds 30

Write-Host "`nChecking service status..."
docker ps --filter "name=auth-service" --format "table {{.Names}}`t{{.Status}}"

Write-Host "`n`nLast 20 lines of logs:"
docker logs projectcode-auth-service-1 --tail 20

Write-Host "`n`nService is ready for testing!"
