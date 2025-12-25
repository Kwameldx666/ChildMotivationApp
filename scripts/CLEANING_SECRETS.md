# Removing secrets from Git history (safe helper)

This repository includes helper scripts to remove secrets from git history and install a pre-commit hook to prevent accidental commits.

Files:
- `scripts/remove-secrets.ps1` - PowerShell helper that builds a replacements.txt and runs `git filter-repo --replace-text`.
- `scripts/install-git-hook.ps1` - Installs a `pre-commit` hook that blocks commits containing common secret patterns.

Important notes
- Rewriting history rewrites commit SHAs. Coordinate with collaborators: they will need to re-clone or rebase their branches.
- **Rotate** any secrets you removed from the history as soon as possible.

Quick usage
1. Install `git-filter-repo` (recommended):
   ```powershell
   pip install git-filter-repo
   ```
2. Back up your repo mirror (the script creates one automatically):
   ```powershell
   .\scripts\remove-secrets.ps1
   ```
   Follow prompts and add the literal secret strings when requested.
3. Install the git hook to prevent future leaks:
   ```powershell
   .\scripts\install-git-hook.ps1
   ```

After running the removal script you will likely need to force-push and coordinate with others:
```powershell
# Force push cleaned history
git push --force-with-lease origin --all
git push --force-with-lease origin --tags
```

If you're unsure, ask for assistance before proceeding. The maintainers can help run the cleanup and ensure CI and other secrets stores are updated.
