<#
.SYNOPSIS
  Start the CareerOS backend server.
.DESCRIPTION
  Activates the virtual environment (if found) and starts uvicorn on localhost:8000.
  Passes through any additional arguments to uvicorn.
.EXAMPLE
  .\scripts\start-backend.ps1
  .\scripts\start-backend.ps1 --reload
#>

$BackendDir = Resolve-Path "$PSScriptRoot\..\backend"
$Python = "python"

# Try common venv locations
$VenvDirs = @(
    "$BackendDir\.venv\Scripts\python.exe",
    "$BackendDir\venv\Scripts\python.exe",
    "$BackendDir\.venv\bin\python",
    "$BackendDir\venv\bin\python"
)

foreach ($vp in $VenvDirs) {
    if (Test-Path $vp) {
        $Python = $vp
        Write-Host "[start-backend] Using virtual environment: $vp"
        break
    }
}

$UvicornArgs = @(
    "--app-dir", $BackendDir,
    "app.main:app",
    "--host", "127.0.0.1",
    "--port", "8000"
)

Write-Host "[start-backend] Starting CareerOS backend on http://127.0.0.1:8000"
Write-Host "[start-backend] Working directory: $BackendDir"
& $Python -m uvicorn $UvicornArgs @Args
