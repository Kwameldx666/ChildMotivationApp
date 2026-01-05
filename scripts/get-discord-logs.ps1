$containerName = "projectcode-auth-service-1"

Write-Host "Getting last 100 lines of auth-service logs..."
$logs = docker logs $containerName --tail 100 2>&1

Write-Host "`nFiltering for Discord-related entries..."
$discordLogs = $logs | Select-String -Pattern "discord|Discord" -Context 1,3

if ($discordLogs) {
    $discordLogs | ForEach-Object { $_.Line }
} else {
    Write-Host "No Discord-related logs found"
}

Write-Host "`n`nAll recent logs:"
$logs
