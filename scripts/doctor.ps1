<#
.SYNOPSIS
  Check local development environment for CareerOS.
.DESCRIPTION
  Verifies Python, Node.js, required folders, pyproject.toml, key docs,
  and reports any issues. Does not modify any files.
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
Write-Host "CareerOS Environment Doctor" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# ── Python ─────────────────────────────────────────────────────
Write-Host "[Python]" -ForegroundColor Yellow
$py = (Get-Command "python" -ErrorAction SilentlyContinue)
Check "python is on PATH" { $py -ne $null }
if ($py) {
    $pyVer = & python --version 2>&1
    Check "python version >= 3.11" { $pyVer -match "3\.(1[1-9]|[2-9]\d)" }
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
