<#
Create an orphan branch with the current working tree and push it to remote.
Use when you need to push but your current branch history contains secrets or is blocked by push-protection.

Usage:
  1) Ensure working tree is clean (commit or stash changes) or run with --force to include uncommitted files.
  2) .\scripts\create-clean-branch.ps1 -BranchName feature/auth-implementation-clean [-Force]

What it does:
  - Creates an orphan branch
  - Adds all files (respecting .gitignore)
  - Commits with provided message
  - Pushes branch to origin

Note: This does NOT remove secret-bearing commits from history. It creates a new branch with a single commit containing the current tree. After merge, you can delete the old branch and optionally clean history.
#>

param(
    [string]$BranchName = "clean-branch",
    [switch]$Force
)

function Require-Git {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "git is not available in PATH. Install git and re-run." -ForegroundColor Red
        exit 1
    }
}

Require-Git

# Ensure clean working tree unless Force
$diff = git status --porcelain
if ($diff -and -not $Force) {
    Write-Host "Working tree is dirty. Commit or stash changes first, or run with -Force to include uncommitted files." -ForegroundColor Yellow
    exit 1
}

# Create orphan branch
Write-Host "Creating orphan branch: $BranchName" -ForegroundColor Cyan
git checkout --orphan $BranchName

# Remove all files from index
git reset --hard

# Add files
git add -A

# Commit
$commitMessage = "Recreate branch $BranchName without history to remove secrets from pushed commits"
git commit -m "$commitMessage"

# Push branch
Write-Host "Pushing $BranchName to origin" -ForegroundColor Green
git push origin $BranchName

Write-Host "Done. Create a pull request to replace the old branch or use this branch as the new working branch." -ForegroundColor Green
