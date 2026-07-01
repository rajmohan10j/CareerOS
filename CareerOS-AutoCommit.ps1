param(
    [string]$ProjectRoot="C:\Users\Raj\Projects\CareerOS",
    [string]$Milestone="manual",
    [string]$Message="Automatic checkpoint",
    [switch]$CreateReleaseZip
)

$ErrorActionPreference="Stop"
Set-Location $ProjectRoot

Write-Host "=== CareerOS Auto Commit ===" -ForegroundColor Cyan

git rev-parse --is-inside-work-tree | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Not a Git repository: $ProjectRoot"
}

git add .

$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No changes to commit."
} else {
    git commit -m $Message
}

if ($Milestone -ne "manual") {
    git tag -f $Milestone
    Write-Host "Tag updated: $Milestone"
}

if ($CreateReleaseZip) {
    $releaseDir = Join-Path $ProjectRoot "releases"
    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
    $zip = Join-Path $releaseDir ("CareerOS-" + $Milestone + "-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".zip")
    Compress-Archive -Path (Join-Path $ProjectRoot "*") -DestinationPath $zip -Force
    Write-Host "Release ZIP created:"
    Write-Host $zip -ForegroundColor Green
}

Write-Host ""
git status
Write-Host ""
Write-Host "Completed." -ForegroundColor Green
