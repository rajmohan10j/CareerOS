<#
.SYNOPSIS
  Run release readiness checks for CareerOS.
.DESCRIPTION
  Verifies tests pass, changelog is updated, roadmap is current,
  execution status is current, no paid API dependencies, no telemetry.
  Does not modify any files.
#>

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$Issues = @()
$Passed = 0
$Failed = 0

function Check {
    param([string]$Label, [scriptblock]$Condition)
    $result = & $Condition
    if ($result) {
        Write-Host "  [PASS] $Label" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "  [FAIL] $Label" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host ""
Write-Host "CareerOS Release Check" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# ── Test verification ─────────────────────────────────────────
Write-Host "[Tests]" -ForegroundColor Yellow

# Check backend tests pass (quick smoke)
$BackendDir = Join-Path $RootDir "backend"
Push-Location $BackendDir
$pytest = & python -m pytest tests/ -q --tb=short 2>&1 | Select-String -Pattern "passed"
Pop-Location
Check "Backend tests pass" { $pytest -ne $null }

# Check browser extension tests
$ExtDir = Join-Path $RootDir "browser-extension"
Push-Location $ExtDir
$extTotal = 0
Get-ChildItem -Path "tests" -Filter "*.test.js" | ForEach-Object {
    $out = node --experimental-vm-modules "tests/$($_.Name)" 2>&1
    $match = [regex]::Match($out, '(\d+) passed')
    if ($match.Success) { $extTotal += [int]$match.Groups[1].Value }
}
Pop-Location
Check "Extension tests pass (570)" { $extTotal -eq 570 }

# Check desktop tests
$DesktopDir = Join-Path $RootDir "desktop"
Push-Location $DesktopDir
$desktop = & npm test 2>&1 | Select-String -Pattern "0 failed"
Pop-Location
Check "Desktop tests pass" { $desktop -ne $null }

# ── Document verification ─────────────────────────────────────
Write-Host ""
Write-Host "[Documentation]" -ForegroundColor Yellow

$changelog = Get-Content (Join-Path $RootDir "CHANGELOG.md") -Raw
Check "CHANGELOG.md has v0.1.1 entry" { $changelog -match "v0\.1\.1" }

$roadmap = Get-Content (Join-Path $RootDir "ROADMAP.md") -Raw
Check "ROADMAP.md has 09T entry" { $roadmap -match "09T" }

$status = Get-Content (Join-Path $RootDir "EXECUTION\002_CURRENT_STATUS.md") -Raw
Check "CURRENT_STATUS has 09S completed" { $status -match "09S" -and $status -match "Completed" }
Check "CURRENT_STATUS has Milestone 09 all completed" { $status -match "Milestone 09 milestones completed" }

$nextTask = Get-Content (Join-Path $RootDir "EXECUTION\003_NEXT_TASK.md") -Raw
Check "NEXT_TASK mentions Milestone 09 all completed" { $nextTask -match "Milestone 09 milestones completed" }

# ── No paid API dependencies ──────────────────────────────────
Write-Host ""
Write-Host "[Dependencies]" -ForegroundColor Yellow

$backendDeps = Get-Content (Join-Path $RootDir "backend\pyproject.toml") -Raw
$paidPatterns = @("openai", "azure", "aws-sdk", "google-cloud", "stripe")
$hasPaidBackend = $false
foreach ($p in $paidPatterns) {
    if ($backendDeps -match $p) { $hasPaidBackend = $true }
}
Check "No paid API deps in backend" { -not $hasPaidBackend }

$desktopPkg = Get-Content (Join-Path $RootDir "desktop\package.json") -Raw
$hasPaidDesktop = $false
foreach ($p in $paidPatterns) {
    if ($desktopPkg -match $p) { $hasPaidDesktop = $true }
}
Check "No paid API deps in desktop" { -not $hasPaidDesktop }

# ── No telemetry ──────────────────────────────────────────────
Write-Host ""
Write-Host "[Telemetry]" -ForegroundColor Yellow

$telemetryPatterns = @("telemetry", "amplitude", "mixpanel", "segment\.", "posthog", "datadog.*RUM")
$allSourceFiles = Get-ChildItem -Path $RootDir -Recurse -Include "*.py","*.js","*.html" `
    | Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\.venv\\" -and $_.FullName -notmatch "\\__pycache__\\" }
$hasTelemetry = $false
foreach ($file in $allSourceFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        foreach ($pat in $telemetryPatterns) {
            if ($content -match $pat) {
                $hasTelemetry = $true
                Write-Host "    Found telemetry pattern '$pat' in $($file.FullName)" -ForegroundColor DarkYellow
            }
        }
    }
}
Check "No telemetry in source files" { -not $hasTelemetry }

# ── Ruff check ────────────────────────────────────────────────
Write-Host ""
Write-Host "[Lint]" -ForegroundColor Yellow

Push-Location $BackendDir
$ruff = & python -m ruff check app tests --quiet 2>&1
$ruffClean = ($LASTEXITCODE -eq 0)
Pop-Location
Check "Ruff is clean" { $ruffClean }

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "======================" -ForegroundColor Cyan
Write-Host "  $Passed passed, $Failed failed" -ForegroundColor $(if ($Failed -gt 0) { "Red" } else { "Green" })
Write-Host "======================" -ForegroundColor Cyan
exit $(if ($Failed -gt 0) { 1 } else { 0 })
