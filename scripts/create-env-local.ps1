<#
Create a local .env file with secret values safely.
This script prompts you for values (secrets are read as secure strings) and writes them
into a `.env` file in the repo root. The `.env` file is ignored by .gitignore so it won't be committed.

Usage:
  .\scripts\create-env-local.ps1

It will ask to confirm before overwriting an existing .env file.
#>

param(
    [switch]$Force,
    [switch]$FromEnv,
    [string]$FromFile
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

function Parse-KeyValuesFromFile([string]$path) {
    $map = @{}
    if (-not (Test-Path $path)) { return $map }
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        if ($line -match "^([^=]+)=(.*)$") {
            $k = $matches[1].Trim()
            $v = $matches[2].Trim()
            $map[$k] = $v
        }
    }
    return $map
}

if (Test-Path $envPath -and -not $Force) {
    $answer = Read-Host "A .env file already exists. Overwrite? (y/N)"
    if ($answer -ne 'y' -and $answer -ne 'Y') { Write-Host "Aborted."; exit 0 }
}

# Gather non-interactive values if requested
$values = @{}
if ($FromFile) {
    $fileMap = Parse-KeyValuesFromFile $FromFile
    foreach ($k in $fileMap.Keys) { $values[$k] = $fileMap[$k] }
}
if ($FromEnv) {
    $expected = @(
        'AUTH_JWT_SECRET','AUTH_GOOGLE_CLIENT_ID','AUTH_GOOGLE_CLIENT_SECRET','AUTH_GOOGLE_REDIRECT_URI','AUTH_DB_CONNECTION','GATEWAY_JWT_SECRET','NEXT_PUBLIC_API_URL','INTERNAL_API_URL'
    )
    foreach ($k in $expected) {
        $v = [Environment]::GetEnvironmentVariable($k)
        if ($v -ne $null -and $v -ne '') { $values[$k] = $v }
    }
}

Write-Host "Enter values for environment variables. Use -FromEnv or -FromFile for non-interactive population." -ForegroundColor Cyan

function Get-Value([string]$key, [string]$prompt, [string]$default="") {
    if ($values.ContainsKey($key)) { return $values[$key] }
    return Read-SecureValue $prompt $default
}

$authJwt = Get-Value 'AUTH_JWT_SECRET' 'AUTH_JWT_SECRET' "$(New-Guid)"
$authGoogleId = Get-Value 'AUTH_GOOGLE_CLIENT_ID' 'AUTH_GOOGLE_CLIENT_ID'
$authGoogleSecret = Get-Value 'AUTH_GOOGLE_CLIENT_SECRET' 'AUTH_GOOGLE_CLIENT_SECRET'
$authGoogleRedirect = Get-Value 'AUTH_GOOGLE_REDIRECT_URI' 'AUTH_GOOGLE_REDIRECT_URI' "http://localhost:8080/auth-service/google/callback"
$authDb = Get-Value 'AUTH_DB_CONNECTION' 'AUTH_DB_CONNECTION' "Host=postgres;Port=5432;Database=db_net;Username=app_owner_net;Password=postgres"
$gatewayJwt = Get-Value 'GATEWAY_JWT_SECRET' 'GATEWAY_JWT_SECRET' "$(New-Guid)"
$nextApi = Get-Value 'NEXT_PUBLIC_API_URL' 'NEXT_PUBLIC_API_URL' "http://localhost:8081"
$internalApi = Get-Value 'INTERNAL_API_URL' 'INTERNAL_API_URL' "http://gateway-service:8081"

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

# Also create service-specific .env files so docker-compose service-level env_file can pick them up
$serviceEnvFiles = @(
    "AuthService/AuthService.Api/.env",
    "GatewayService/Gateway.Api/.env",
    "UserService/UserService.Api/.env",
    "Frontend/.env"
)

foreach ($serviceEnv in $serviceEnvFiles) {
    $serviceDir = Split-Path $serviceEnv -Parent
    if (Test-Path $serviceDir) {
        $content | Out-File -FilePath $serviceEnv -Encoding UTF8 -Force
        Write-Host "Wrote $serviceEnv" -ForegroundColor Green
    }
}

Write-Host "Created $envPath (will not be committed if .gitignore is set correctly)." -ForegroundColor Green
Write-Host "Run: docker-compose up -d postgres auth-service gateway-service frontend" -ForegroundColor Yellow
Write-Host "Tip: run with -FromFile secrets.txt or -FromEnv to populate values non-interactively." -ForegroundColor Cyan
