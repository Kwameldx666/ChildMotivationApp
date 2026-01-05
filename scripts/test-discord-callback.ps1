# Test Discord OAuth callback endpoint
Write-Host "Testing Discord callback endpoint..."

$response = Invoke-WebRequest -Uri "http://localhost:8080/auth-service/discord/callback?code=testcode&state=teststate" -Method Get -MaximumRedirection 0 -ErrorAction SilentlyContinue -ErrorVariable err

if ($response) {
    Write-Host "StatusCode: $($response.StatusCode)"
    Write-Host "Headers:"
    $response.Headers | Format-Table
    Write-Host "Content: $($response.Content)"
} elseif ($err) {
    Write-Host "Error occurred: $($err[0].Message)"
    if ($err[0].Exception.Response) {
        $statusCode = [int]$err[0].Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode"
        if ($err[0].Exception.Response.Headers.Location) {
            Write-Host "Redirect Location: $($err[0].Exception.Response.Headers.Location)"
        }
    }
}
