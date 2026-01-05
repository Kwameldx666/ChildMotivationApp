$logs = docker logs projectcode-auth-service-1 --tail 200 2>&1

Write-Host "=== Searching for state 98SKjpVm ==="
$logs | Select-String -Pattern "98SKjpVm" -Context 2,10

Write-Host "`n=== Searching for GitHubCallback ==="
$logs | Select-String -Pattern "GitHubCallback" -Context 0,3 | Select-Object -Last 5

Write-Host "`n=== Searching for Redis errors ==="
$logs | Select-String -Pattern "Redis.*error|attempting to get state|DistributedOAuthStateStore.*error" -Context 1,3

Write-Host "`n=== Last 30 lines of logs ==="
$logs | Select-Object -Last 30
