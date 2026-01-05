Write-Host "Checking auth-service status..."
docker ps --filter "name=auth-service" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "`n"

Write-Host "Last 50 lines of auth-service logs:"
docker logs projectcode-auth-service-1 --tail 50
