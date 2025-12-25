<#
Installs a pre-commit hook that blocks commits containing likely secret patterns.
Run from repo root: .\scripts\install-git-hook.ps1
#>

$hookPath = Join-Path (Join-Path (Get-Location) '.git') 'hooks\pre-commit'

$hookContent = @'
#!/bin/sh
# Pre-commit hook to detect likely secrets in staged changes
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi
PATTERN='(GOCSPX|client_secret|AUTH_GOOGLE_CLIENT_SECRET|Authentication__Google__ClientSecret|private_key|-----BEGIN PRIVATE KEY-----|AIza[0-9A-Za-z_-]{35})'
if git diff --cached --name-only --diff-filter=ACM | xargs -r git grep -En "$PATTERN" >/dev/null 2>&1; then
  echo "Error: potential secret detected in staged changes. Aborting commit."
  echo "Run 'git restore --staged <file>' to unstage or remove the secret before committing." >&2
  exit 1
fi
exit 0
'@

# Write hook
Set-Content -Path $hookPath -Value $hookContent -NoNewline
# Make hook executable (Unix WSL) if applicable
if (Get-Command chmod -ErrorAction SilentlyContinue) { chmod +x $hookPath }

Write-Host "Installed pre-commit hook to $hookPath" -ForegroundColor Green
