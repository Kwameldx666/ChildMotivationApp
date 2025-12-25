<#
Create a local .env file with secret values safely.
This script prompts you for values (secrets are read as secure strings) and writes them
into a `.env` file in the repo root. The `.env` file is ignored by .gitignore so it won't be committed.

Usage:
  .\scripts\create-env-local.ps1

It will ask to confirm before overwriting an existing .env file.
#>

param(
    [switch]$Force
)

$repoRoot = (Get-Location).Path
$envPath = Join-Path $repoRoot ".env"

function Read-SecureValue([string]$prompt, [string]$default="") {
    if ($default -ne "") { $prompt = "$prompt [$default]" }
    $secure = Read-Host -AsSecureString $prompt
    if ($secure.Length -eq 0 -and $default -ne "") {
        return $default
    }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

if (Test-Path $envPath -and -not $Force) {
    $answer = Read-Host "A .env file already exists. Overwrite? (y/N)"
    if ($answer -ne 'y' -and $answer -ne 'Y') { Write-Host "Aborted."; exit 0 }
}

Write-Host "Enter values for environment variables. Leave blank to use defaults shown in brackets." -ForegroundColor Cyan

$authJwt = Read-SecureValue "AUTH_JWT_SECRET" "$(New-Guid)"
$authGoogleId = Read-SecureValue "AUTH_GOOGLE_CLIENT_ID"
$authGoogleSecret = Read-SecureValue "AUTH_GOOGLE_CLIENT_SECRET"
$authGoogleRedirect = Read-SecureValue "AUTH_GOOGLE_REDIRECT_URI" "http://localhost:8080/auth-service/auth/google/callback"
$authDb = Read-SecureValue "AUTH_DB_CONNECTION" "Host=postgres;Port=5432;Database=db_net;Username=app_owner_net;Password=postgres"
$gatewayJwt = Read-SecureValue "GATEWAY_JWT_SECRET" "$(New-Guid)"
$nextApi = Read-SecureValue "NEXT_PUBLIC_API_URL" "http://localhost:8081"
$internalApi = Read-SecureValue "INTERNAL_API_URL" "http://gateway-service:8081"

# Build content
$content = @()
$content += "# Generated .env — do NOT commit"
$content += "AUTH_JWT_SECRET=$authJwt"
if ($authGoogleId -ne "") { $content += "AUTH_GOOGLE_CLIENT_ID=$authGoogleId" }
if ($authGoogleSecret -ne "") { $content += "AUTH_GOOGLE_CLIENT_SECRET=$authGoogleSecret" }
$content += "AUTH_GOOGLE_REDIRECT_URI=$authGoogleRedirect"
$content += "AUTH_DB_CONNECTION=$authDb"
$content += "GATEWAY_JWT_SECRET=$gatewayJwt"
$content += "NEXT_PUBLIC_API_URL=$nextApi"
$content += "INTERNAL_API_URL=$internalApi"

$content | Out-File -FilePath $envPath -Encoding UTF8 -Force

Write-Host "Created $envPath (will not be committed if .gitignore is set correctly)." -ForegroundColor Green
Write-Host "Run: docker-compose up -d postgres auth-service gateway-service frontend" -ForegroundColor Yellow
