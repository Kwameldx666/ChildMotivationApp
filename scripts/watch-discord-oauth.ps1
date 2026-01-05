Write-Host "Watching auth-service logs for Discord OAuth..."
Write-Host "Press Ctrl+C to stop"
Write-Host ""

docker logs projectcode-auth-service-1 -f 2>&1 | Select-String -Pattern "discord|Discord|callback|Callback|error|Error|exception|Exception" -Context 0,2
