<#
.SYNOPSIS
  Run all verification checks: backend tests, extension tests, desktop tests, Ruff.
.DESCRIPTION
  Executes all test scripts in sequence and reports overall status.
  Does not modify any files.
#>

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$ExitCode = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CareerOS — Full Verification Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Backend tests ──────────────────────────────────────────────
Write-Host ">>> [verify-all] Backend tests" -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "test-backend.ps1")
if ($LASTEXITCODE -ne 0) { $ExitCode = 1 }
Write-Host ""

# ── Extension tests ────────────────────────────────────────────
Write-Host ">>> [verify-all] Extension tests" -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "test-extension.ps1")
if ($LASTEXITCODE -ne 0) { $ExitCode = 1 }
Write-Host ""

# ── Desktop tests ──────────────────────────────────────────────
Write-Host ">>> [verify-all] Desktop tests" -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "test-desktop.ps1")
if ($LASTEXITCODE -ne 0) { $ExitCode = 1 }
Write-Host ""

# ── Summary ────────────────────────────────────────────────────
Write-Host "========================================" -ForegroundColor Cyan
if ($ExitCode -ne 0) {
    Write-Host "  Some checks FAILED" -ForegroundColor Red
} else {
    Write-Host "  All checks PASSED" -ForegroundColor Green
}
Write-Host "========================================" -ForegroundColor Cyan
exit $ExitCode
