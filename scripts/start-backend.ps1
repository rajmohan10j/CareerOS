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

function Test-HttpOk {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    } catch {
        return $false
    }
}

function Test-PortOpen {
    param([int]$Port)
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $task = $client.ConnectAsync("127.0.0.1", $Port)
        if (-not $task.Wait(750)) { return $false }
        return $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

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

& $Python -c "import uvicorn, fastapi, sqlmodel" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[start-backend] Missing backend dependencies." -ForegroundColor Red
    Write-Host "[start-backend] Run: cd backend; python -m venv .venv; .venv\Scripts\Activate.ps1; pip install -e `".[dev]`""
    exit 1
}

if (Test-PortOpen 8000) {
    if (Test-HttpOk "http://127.0.0.1:8000/health") {
        Write-Host "[start-backend] CareerOS backend is already running at http://127.0.0.1:8000" -ForegroundColor Green
        exit 0
    }
    Write-Host "[start-backend] Port 8000 is already in use, but CareerOS /health did not respond." -ForegroundColor Red
    Write-Host "[start-backend] Stop the process using port 8000 or start uvicorn on a different port."
    exit 1
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
