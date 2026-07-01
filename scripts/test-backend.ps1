<#
.SYNOPSIS
  Run all CareerOS backend tests and Ruff linting.
.DESCRIPTION
  Runs Ruff check and pytest in the backend directory.
  Exits with non-zero if any check fails.
#>

$BackendDir = Join-Path $PSScriptRoot ".." "backend" -Resolve
$Python = "python"

# Try common venv locations
$VenvDirs = @(
    Join-Path $BackendDir ".venv\Scripts\python.exe",
    Join-Path $BackendDir "venv\Scripts\python.exe",
    Join-Path $BackendDir ".venv\bin\python",
    Join-Path $BackendDir "venv\bin\python"
)

foreach ($vp in $VenvDirs) {
    if (Test-Path $vp) {
        $Python = $vp
        break
    }
}

$ErrorActionPreference = "Continue"
$ExitCode = 0

Write-Host "[test-backend] Running Ruff..."
& $Python -m ruff check $BackendDir\app $BackendDir\tests
if ($LASTEXITCODE -ne 0) {
    Write-Host "[test-backend] FAILED: Ruff found issues" -ForegroundColor Red
    $ExitCode = 1
} else {
    Write-Host "[test-backend] Ruff passed" -ForegroundColor Green
}

Write-Host ""
Write-Host "[test-backend] Running pytest..."
Push-Location $BackendDir
& $Python -m pytest tests/ -q --tb=short
if ($LASTEXITCODE -ne 0) {
    Write-Host "[test-backend] FAILED: Some tests failed" -ForegroundColor Red
    $ExitCode = 1
} else {
    Write-Host "[test-backend] All tests passed" -ForegroundColor Green
}
Pop-Location

if ($ExitCode -ne 0) {
    Write-Host "[test-backend] Some checks failed" -ForegroundColor Red
} else {
    Write-Host "[test-backend] All checks passed" -ForegroundColor Green
}
exit $ExitCode
