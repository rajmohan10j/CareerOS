<#
.SYNOPSIS
  Run all CareerOS desktop app tests.
#>

$DesktopDir = Join-Path $PSScriptRoot ".." "desktop" -Resolve

Write-Host "[test-desktop] Running desktop tests..."
Push-Location $DesktopDir
npm test
$ExitCode = $LASTEXITCODE
Pop-Location

if ($ExitCode -ne 0) {
    Write-Host "[test-desktop] FAILED: Some desktop tests failed" -ForegroundColor Red
} else {
    Write-Host "[test-desktop] All desktop tests passed" -ForegroundColor Green
}
exit $ExitCode
