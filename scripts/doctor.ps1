<#
.SYNOPSIS
  Check local development environment for CareerOS.
.DESCRIPTION
  Verifies Python, Node.js, required folders, pyproject.toml, key docs,
  and reports any issues. Does not modify any files.
#>

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $RootDir "backend"
$DesktopDir = Join-Path $RootDir "desktop"
$ExtensionDir = Join-Path $RootDir "browser-extension"
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

function Test-PythonImport {
    param([string]$Python, [string]$Module)
    & $Python -c "import $Module" *> $null
    return $LASTEXITCODE -eq 0
}

Write-Host ""
Write-Host "CareerOS Environment Doctor" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# ── Python ─────────────────────────────────────────────────────
Write-Host "[Python]" -ForegroundColor Yellow
$Python = Get-BackendPython
$py = (Get-Command $Python -ErrorAction SilentlyContinue)
Check "python is on PATH" { $py -ne $null }
if ($py) {
    $pyVer = & $Python --version 2>&1
    Check "python version >= 3.11" { $pyVer -match "3\.(1[1-9]|[2-9]\d)" }
    Check "FastAPI import works" { Test-PythonImport $Python "fastapi" }
    Check "uvicorn import works" { Test-PythonImport $Python "uvicorn" }
    Check "pytest import works" { Test-PythonImport $Python "pytest" }
    Check "ruff import works" { Test-PythonImport $Python "ruff" }
}

# ── Node.js ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[Node.js]" -ForegroundColor Yellow
$node = (Get-Command "node" -ErrorAction SilentlyContinue)
Check "node is on PATH" { $node -ne $null }
if ($node) {
    $nodeVer = & node --version
    Check "node version >= 18" { $nodeVer -match "v(1[89]|[2-9]\d)" }
    $npm = (Get-Command "npm" -ErrorAction SilentlyContinue)
    Check "npm is on PATH" { $npm -ne $null }
}

# ── Required folders ───────────────────────────────────────────
Write-Host ""
Write-Host "[Folders]" -ForegroundColor Yellow
Check "backend/ exists" { Test-Path (Join-Path $RootDir "backend\app") }
Check "backend/tests/ exists" { Test-Path (Join-Path $RootDir "backend\tests") }
Check "browser-extension/ exists" { Test-Path (Join-Path $RootDir "browser-extension\src") }
Check "desktop/ exists" { Test-Path (Join-Path $RootDir "desktop\src") }
Check "plugins/ exists" { Test-Path (Join-Path $RootDir "plugins\docs") }
Check "scripts/ exists" { Test-Path (Join-Path $RootDir "scripts") }
Check "docs/ exists" { Test-Path (Join-Path $RootDir "docs") }
Check "EXECUTION/ exists" { Test-Path (Join-Path $RootDir "EXECUTION") }

# ── Key files ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[Files]" -ForegroundColor Yellow
Check "backend/pyproject.toml exists" { Test-Path (Join-Path $RootDir "backend\pyproject.toml") }
Check "desktop/package.json exists" { Test-Path (Join-Path $RootDir "desktop\package.json") }
Check "browser-extension/package.json exists" { Test-Path (Join-Path $RootDir "browser-extension\package.json") }
Check "ROADMAP.md exists" { Test-Path (Join-Path $RootDir "ROADMAP.md") }
Check "CHANGELOG.md exists" { Test-Path (Join-Path $RootDir "CHANGELOG.md") }
Check "SECURITY.md exists" { Test-Path (Join-Path $RootDir "SECURITY.md") }
Check "README.md exists" { Test-Path (Join-Path $RootDir "README.md") }
Check "scripts/setup-check.ps1 exists" { Test-Path (Join-Path $RootDir "scripts\setup-check.ps1") }

# ── Project scripts ────────────────────────────────────────────
Write-Host ""
Write-Host "[Project Scripts]" -ForegroundColor Yellow
$desktopPkgPath = Join-Path $DesktopDir "package.json"
$extensionPkgPath = Join-Path $ExtensionDir "package.json"
if (Test-Path $desktopPkgPath) {
    $desktopPkg = Get-Content $desktopPkgPath -Raw | ConvertFrom-Json
    Check "desktop npm start exists" { $desktopPkg.scripts.start -ne $null }
    Check "desktop npm test exists" { $desktopPkg.scripts.test -ne $null }
}
if (Test-Path $extensionPkgPath) {
    $extensionPkg = Get-Content $extensionPkgPath -Raw | ConvertFrom-Json
    Check "browser-extension npm test exists" { $extensionPkg.scripts.test -ne $null }
}

# ── Key docs ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[Documentation]" -ForegroundColor Yellow
Check "ENGINEERING_BIBLE/README.md exists" { Test-Path (Join-Path $RootDir "ENGINEERING_BIBLE\README.md") }
Check "EXECUTION/002_CURRENT_STATUS.md exists" { Test-Path (Join-Path $RootDir "EXECUTION\002_CURRENT_STATUS.md") }
Check "EXECUTION/003_NEXT_TASK.md exists" { Test-Path (Join-Path $RootDir "EXECUTION\003_NEXT_TASK.md") }
Check "docs/08-operations/ exists" { Test-Path (Join-Path $RootDir "docs\08-operations") }

# ── Summary ────────────────────────────────────────────────────
Write-Host ""
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "  $Passed passed, $Failed failed" -ForegroundColor $(if ($Failed -gt 0) { "Red" } else { "Green" })
Write-Host "===========================" -ForegroundColor Cyan
exit $(if ($Failed -gt 0) { 1 } else { 0 })
