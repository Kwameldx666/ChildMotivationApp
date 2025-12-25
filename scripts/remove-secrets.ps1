<#
PowerShell script to remove secrets from git history using git-filter-repo.
IMPORTANT: This rewrites git history and requires coordination with collaborators.
Usage:
  - Install git-filter-repo (pip install git-filter-repo) or place git-filter-repo script in PATH
  - Run from repo root: .\scripts\remove-secrets.ps1
  - Enter the literal secret values when prompted (they will be replaced with REDACTED markers)

This script will:
  1) Create a bare mirror backup in ../repo-backup.git
  2) Create a replacements file for git-filter-repo
  3) Run git filter-repo --replace-text replacements.txt
  4) Force push the cleaned branches and tags

Be sure to rotate any exposed credentials BEFORE or IMMEDIATELY AFTER running this.
#>

param(
    [switch]$DryRun
)

function Require-Command([string]$cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "Command '$cmd' not found. Please install it and re-run this script." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "*** Git history secret removal helper ***" -ForegroundColor Cyan

# Check for git
Require-Command git

# Check for python + git-filter-repo possibility
$filterRepoAvailable = (Get-Command git-filter-repo -ErrorAction SilentlyContinue) -ne $null
if (-not $filterRepoAvailable) {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($null -eq $python) { $python = Get-Command python3 -ErrorAction SilentlyContinue }
    if ($null -ne $python) {
        $check = & $python.Path -c "import sys, pkgutil; sys.exit(0 if pkgutil.find_loader('git_filter_repo') else 1)" 2>$null
        $filterRepoAvailable = $LASTEXITCODE -eq 0
    }
}

if (-not $filterRepoAvailable) {
    Write-Host "git-filter-repo not found. Install via 'pip install git-filter-repo' and ensure git-filter-repo is on PATH." -ForegroundColor Yellow
    Write-Host "Alternative: download the git-filter-repo standalone script from https://github.com/newren/git-filter-repo" -ForegroundColor Yellow
}

# Back up current repository as a bare mirror
$repoPath = (Get-Location).Path
$backupPath = Join-Path $repoPath "..\repo-backup.git"
if (Test-Path $backupPath) {
    Write-Host "Backup mirror already exists at $backupPath. Skipping creation." -ForegroundColor Yellow
} else {
    Write-Host "Creating bare mirror backup at: $backupPath" -ForegroundColor Green
    git clone --mirror . $backupPath
    if ($LASTEXITCODE -ne 0) { Write-Host "Failed to create mirror backup. Aborting." -ForegroundColor Red; exit 1 }
}

# Collect secrets to remove
Write-Host "Enter literal secret values to remove from Git history. You can enter multiple, separated by newline. Finish input with an empty line." -ForegroundColor Cyan
$secrets = @()
while ($true) {
    $line = Read-Host "Secret (leave blank to finish)"
    if ([string]::IsNullOrWhiteSpace($line)) { break }
    $secrets += $line
}

if ($secrets.Count -eq 0) {
    Write-Host "No secrets provided; aborting." -ForegroundColor Yellow
    exit 0
}

$replacementsFile = Join-Path $repoPath "replacements.txt"
Write-Host "Writing replacements file to $replacementsFile" -ForegroundColor Green
$sb = New-Object System.Text.StringBuilder
foreach ($s in $secrets) {
    $escaped = $s -replace "\\","\\\\"
    $sb.AppendLine("$escaped==>REDACTED") | Out-Null
}
[System.IO.File]::WriteAllText($replacementsFile, $sb.ToString())

Write-Host "Replacements file content:" -ForegroundColor DarkCyan
Get-Content $replacementsFile | ForEach-Object { Write-Host "  $_" }

if ($DryRun) { Write-Host "Dry run requested: exiting before rewriting history." -ForegroundColor Yellow; exit 0 }

if (-not $filterRepoAvailable) {
    Write-Host "git-filter-repo not available; aborting." -ForegroundColor Red
    exit 1
}

Write-Host "Running git filter-repo --replace-text replacements.txt" -ForegroundColor Green
# Run the tool
git filter-repo --replace-text $replacementsFile
if ($LASTEXITCODE -ne 0) { Write-Host "git-filter-repo failed." -ForegroundColor Red; exit 1 }

Write-Host "Pushing cleaned refs (force push) to origin." -ForegroundColor Yellow
Write-Host "THIS WILL REWRITE REMOTE HISTORY. Ensure collaborators are informed." -ForegroundColor Red

# Push all branches and tags with force-with-lease
git push --force-with-lease origin --all
git push --force-with-lease origin --tags

Write-Host "Cleaning temporary files." -ForegroundColor Green
Remove-Item $replacementsFile -Force

Write-Host "Done. Remember to rotate any exposed credentials and tell collaborators to re-clone or run required rebase steps." -ForegroundColor Green
