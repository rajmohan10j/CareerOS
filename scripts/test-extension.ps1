<#
.SYNOPSIS
  Run all CareerOS browser extension tests.
#>

$ExtensionDir = Join-Path $PSScriptRoot ".." "browser-extension" -Resolve

Write-Host "[test-extension] Running extension tests..."
Push-Location $ExtensionDir
npm test
$ExitCode = $LASTEXITCODE
Pop-Location

if ($ExitCode -ne 0) {
    Write-Host "[test-extension] FAILED: Some extension tests failed" -ForegroundColor Red
} else {
    Write-Host "[test-extension] All extension tests passed" -ForegroundColor Green
}
exit $ExitCode
