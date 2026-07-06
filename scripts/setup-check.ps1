<#
.SYNOPSIS
  Verify CareerOS first-run setup readiness.
.DESCRIPTION
  Checks local tools, backend Python dependencies, npm project metadata, expected
  ports, and optional live backend/desktop endpoints. Does not modify files.
.PARAMETER RequireLive
  Fail when backend or desktop live endpoints are not reachable.
.EXAMPLE
  .\scripts\setup-check.ps1
  .\scripts\setup-check.ps1 -RequireLive
#>

param(
    [string]$BackendUrl = "http://127.0.0.1:8000",
    [string]$DesktopUrl = "http://127.0.0.1:5173",
    [switch]$RequireLive
)

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $RootDir "backend"
$DesktopDir = Join-Path $RootDir "desktop"
$ExtensionDir = Join-Path $RootDir "browser-extension"
$Passed = 0
$Warned = 0
$Failed = 0

function Pass {
    param([string]$Label)
    Write-Host "  [PASS] $Label" -ForegroundColor Green
    $script:Passed++
}

function Warn {
    param([string]$Label)
    Write-Host "  [WARN] $Label" -ForegroundColor Yellow
    $script:Warned++
}

function Fail {
    param([string]$Label)
    Write-Host "  [FAIL] $Label" -ForegroundColor Red
    $script:Failed++
}

function Check {
    param([string]$Label, [scriptblock]$Condition)
    try {
        if (& $Condition) { Pass $Label } else { Fail $Label }
    } catch {
        Fail "$Label ($($_.Exception.Message))"
    }
}

function Get-BackendPython {
    $candidates = @(
        (Join-Path $BackendDir ".venv\Scripts\python.exe"),
        (Join-Path $BackendDir "venv\Scripts\python.exe"),
        (Join-Path $BackendDir ".venv\bin\python"),
        (Join-Path $BackendDir "venv\bin\python")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return "python"
}

function Test-HttpOk {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
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

function Test-PythonImport {
    param([string]$Python, [string]$Module)
    & $Python -c "import $Module" *> $null
    return $LASTEXITCODE -eq 0
}

Write-Host ""
Write-Host "CareerOS First-Run Setup Check" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[Tools]" -ForegroundColor Yellow
$python = Get-BackendPython
Check "Python is available" { Get-Command $python -ErrorAction SilentlyContinue }
if (Get-Command $python -ErrorAction SilentlyContinue) {
    $pyVer = & $python --version 2>&1
    Check "Python version is 3.11+" { $pyVer -match "3\.(1[1-9]|[2-9]\d)" }
}

$node = Get-Command "node" -ErrorAction SilentlyContinue
Check "Node.js is available" { $node -ne $null }
if ($node) {
    $nodeVer = & node --version
    Check "Node.js version is 18+" { $nodeVer -match "v(1[89]|[2-9]\d)" }
}
Check "npm is available" { Get-Command "npm" -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "[Backend Dependencies]" -ForegroundColor Yellow
Check "backend/pyproject.toml exists" { Test-Path (Join-Path $BackendDir "pyproject.toml") }
Check "FastAPI is importable" { Test-PythonImport $python "fastapi" }
Check "uvicorn is importable" { Test-PythonImport $python "uvicorn" }
Check "SQLModel is importable" { Test-PythonImport $python "sqlmodel" }
Check "pytest is importable" { Test-PythonImport $python "pytest" }
Check "ruff is importable" { Test-PythonImport $python "ruff" }

Write-Host ""
Write-Host "[Frontend Projects]" -ForegroundColor Yellow
$desktopPkgPath = Join-Path $DesktopDir "package.json"
$extensionPkgPath = Join-Path $ExtensionDir "package.json"
Check "desktop/package.json exists" { Test-Path $desktopPkgPath }
Check "browser-extension/package.json exists" { Test-Path $extensionPkgPath }
if (Test-Path $desktopPkgPath) {
    $desktopPkg = Get-Content $desktopPkgPath -Raw | ConvertFrom-Json
    Check "desktop has start script" { $desktopPkg.scripts.start -ne $null }
    Check "desktop has test script" { $desktopPkg.scripts.test -ne $null }
}
if (Test-Path $extensionPkgPath) {
    $extensionPkg = Get-Content $extensionPkgPath -Raw | ConvertFrom-Json
    Check "browser-extension has test script" { $extensionPkg.scripts.test -ne $null }
}

Write-Host ""
Write-Host "[Ports]" -ForegroundColor Yellow
if (Test-PortOpen 8000) {
    if (Test-HttpOk "$BackendUrl/health") {
        Pass "port 8000 is serving CareerOS backend health"
    } else {
        Warn "port 8000 is occupied, but $BackendUrl/health did not respond"
    }
} else {
    Warn "port 8000 is free; start backend with .\scripts\start-backend.ps1"
}

if (Test-PortOpen 5173) {
    if (Test-HttpOk $DesktopUrl) {
        Pass "port 5173 is serving the desktop app"
    } else {
        Warn "port 5173 is occupied, but $DesktopUrl did not respond"
    }
} else {
    Warn "port 5173 is free; start desktop with npm start from desktop/"
}

Write-Host ""
Write-Host "[Live Endpoints]" -ForegroundColor Yellow
$backendLive = Test-HttpOk "$BackendUrl/health"
if ($backendLive) {
    Pass "backend /health is reachable"
} elseif ($RequireLive) {
    Fail "backend /health is not reachable at $BackendUrl/health"
} else {
    Warn "backend /health is not reachable yet"
}

$docsLive = Test-HttpOk "$BackendUrl/docs"
if ($docsLive) {
    Pass "backend /docs is reachable"
} elseif ($RequireLive) {
    Fail "backend /docs is not reachable at $BackendUrl/docs"
} else {
    Warn "backend /docs is not reachable yet"
}

$desktopLive = Test-HttpOk $DesktopUrl
if ($desktopLive) {
    Pass "desktop app is reachable"
} elseif ($RequireLive) {
    Fail "desktop app is not reachable at $DesktopUrl"
} else {
    Warn "desktop app is not reachable yet"
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "  $Passed passed, $Warned warnings, $Failed failed" -ForegroundColor $(if ($Failed -gt 0) { "Red" } elseif ($Warned -gt 0) { "Yellow" } else { "Green" })
Write-Host "==============================" -ForegroundColor Cyan

if ($Warned -gt 0 -and $Failed -eq 0) {
    Write-Host "Tip: run with -RequireLive after starting backend and desktop to verify the full local loop." -ForegroundColor DarkYellow
}

exit $(if ($Failed -gt 0) { 1 } else { 0 })
