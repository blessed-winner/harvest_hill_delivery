# PowerShell script to push backend subtree to hamwenawe backend repository
$commit = (git subtree split --prefix=backend main).Trim()
Write-Host "Split backend commit: $commit"
git push backend "${commit}:main" --force
