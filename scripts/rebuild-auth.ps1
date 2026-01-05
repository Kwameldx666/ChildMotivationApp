Write-Host "Stopping auth-service..."
docker-compose -f "c:\Users\Kwameldx666\Desktop\Education\дипломная работа\project code\docker-compose.yml" stop auth-service

Write-Host "`nRebuilding auth-service..."
docker-compose -f "c:\Users\Kwameldx666\Desktop\Education\дипломная работа\project code\docker-compose.yml" build auth-service

Write-Host "`nStarting auth-service..."
docker-compose -f "c:\Users\Kwameldx666\Desktop\Education\дипломная работа\project code\docker-compose.yml" up -d auth-service

Write-Host "`nWaiting 10 seconds for service to start..."
Start-Sleep -Seconds 10

Write-Host "`nAuth-service logs (last 30 lines):"
docker logs projectcode-auth-service-1 --tail 30
