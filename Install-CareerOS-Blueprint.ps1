<# 
CareerOS Installer / Updater
Version: 0.1.0
Purpose: Install or update CareerOS Blueprint packs into a local CareerOS repository.

Default paths:
- Project:   C:\Users\Raj\Projects\CareerOS
- Blueprint: C:\Users\Raj\Projects\CareerOS-Blueprint

Usage:
1. Put this script in the same folder as:
   - CareerOS-Blueprint-v0.2-Update-Pack.zip
   - CareerOS-Blueprint-v0.2-Update-Summary.docx
2. Right-click PowerShell and run as normal user.
3. Run:
   powershell -ExecutionPolicy Bypass -File .\Install-CareerOS-Blueprint.ps1

Optional:
   powershell -ExecutionPolicy Bypass -File .\Install-CareerOS-Blueprint.ps1 -RunTests
#>

param(
    [string]$ProjectRoot = "C:\Users\Raj\Projects\CareerOS",
    [string]$BlueprintRoot = "C:\Users\Raj\Projects\CareerOS-Blueprint",
    [string]$ZipFile = "$PSScriptRoot\CareerOS-Blueprint-v0.2-Update-Pack.zip",
    [string]$SummaryFile = "$PSScriptRoot\CareerOS-Blueprint-v0.2-Update-Summary.docx",
    [switch]$RunTests,
    [switch]$CreateGitCommit
)

$ErrorActionPreference = "Stop"

function Write-Header($Text) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
}

function Assert-PathExists($Path, $Message) {
    if (-not (Test-Path $Path)) {
        throw "$Message`nPath: $Path"
    }
}

Write-Header "CareerOS Blueprint Installer v0.1.0"

Write-Host "Project Root:   $ProjectRoot"
Write-Host "Blueprint Root: $BlueprintRoot"
Write-Host "Zip File:       $ZipFile"
Write-Host ""

Assert-PathExists $ProjectRoot "CareerOS project folder not found."
Assert-PathExists $ZipFile "Blueprint update ZIP not found."

$ReleaseDir = Join-Path $BlueprintRoot "Releases"
$ArchiveDir = Join-Path $BlueprintRoot "Archive"
$VersionDir = Join-Path $BlueprintRoot "v0.2"
$BackupDir = Join-Path $BlueprintRoot ("Archive\CareerOS-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))

Write-Header "Creating required folders"

New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null
New-Item -ItemType Directory -Force -Path $ArchiveDir | Out-Null
New-Item -ItemType Directory -Force -Path $VersionDir | Out-Null

Write-Header "Creating backup"

Copy-Item -Path $ProjectRoot -Destination $BackupDir -Recurse -Force
Write-Host "Backup created at:"
Write-Host $BackupDir -ForegroundColor Green

Write-Header "Extracting Blueprint update pack"

Expand-Archive -LiteralPath $ZipFile -DestinationPath $VersionDir -Force

if (Test-Path $SummaryFile) {
    Copy-Item -Path $SummaryFile -Destination $ReleaseDir -Force
    Write-Host "Summary copied to Releases folder."
}

$ExtractedRoot = Join-Path $VersionDir "CareerOS-Blueprint-v0.2-Update-Pack"

if (-not (Test-Path $ExtractedRoot)) {
    $candidate = Get-ChildItem -Path $VersionDir -Directory | Select-Object -First 1
    if ($candidate) {
        $ExtractedRoot = $candidate.FullName
    }
}

Assert-PathExists $ExtractedRoot "Extracted update folder not found."

Write-Header "Merging files into CareerOS"

robocopy $ExtractedRoot $ProjectRoot /E /R:1 /W:1 | Out-Null

$RobocopyExit = $LASTEXITCODE
if ($RobocopyExit -gt 7) {
    throw "Robocopy failed with exit code $RobocopyExit"
}

Write-Host "Files merged into:"
Write-Host $ProjectRoot -ForegroundColor Green

Write-Header "Validating repository"

$RequiredPaths = @(
    "README.md",
    "ROADMAP.md",
    "AI_DEVELOPMENT_PLAYBOOK.md",
    "docs",
    "adr",
    "EXECUTION"
)

foreach ($rel in $RequiredPaths) {
    $full = Join-Path $ProjectRoot $rel
    if (-not (Test-Path $full)) {
        Write-Warning "Missing expected path: $rel"
    } else {
        Write-Host "OK: $rel"
    }
}

if ($RunTests) {
    Write-Header "Running backend tests"

    $BackendPath = Join-Path $ProjectRoot "backend"
    if (Test-Path $BackendPath) {
        Push-Location $BackendPath
        try {
            python -m pytest
        } finally {
            Pop-Location
        }
    } else {
        Write-Warning "Backend folder not found. Skipping tests."
    }
}

if ($CreateGitCommit) {
    Write-Header "Creating Git commit"

    Push-Location $ProjectRoot
    try {
        git status
        git add .
        git commit -m "docs: apply CareerOS Blueprint v0.2 update"
    } finally {
        Pop-Location
    }
}

Write-Header "Update Complete"

Write-Host "Backup:    $BackupDir"
Write-Host "Blueprint: $VersionDir"
Write-Host "Project:   $ProjectRoot"
Write-Host ""
Write-Host "Recommended next commands:"
Write-Host "  cd $ProjectRoot"
Write-Host "  git status"
Write-Host "  git add ."
Write-Host "  git commit -m `"docs: apply CareerOS Blueprint v0.2 update`""
Write-Host ""
