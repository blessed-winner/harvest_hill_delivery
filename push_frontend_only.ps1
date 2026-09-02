# PowerShell script to push frontend subtree to hamwenawe frontend repository
$commit = (git subtree split --prefix=frontend main).Trim()
Write-Host "Split frontend commit: $commit"
git push client "${commit}:main" --force
