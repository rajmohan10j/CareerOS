@echo off
setlocal enabledelayedexpansion

title CareerOS Launcher
echo ========================================================
echo           CareerOS - Local AI Career Platform
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "DESKTOP_DIR=%ROOT_DIR%desktop"

:: Verify Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python was not found in your PATH.
    echo Please install Python 3.11+ and try again.
    pause
    exit /b 1
)

echo [1/3] Starting CareerOS Backend on http://127.0.0.1:8000 ...
start "CareerOS Backend (Port 8000)" cmd /k "cd /d "%BACKEND_DIR%" && title CareerOS Backend && echo [Backend Running on port 8000] && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting CareerOS Desktop on http://localhost:5173 ...
start "CareerOS Desktop (Port 5173)" cmd /k "cd /d "%DESKTOP_DIR%" && title CareerOS Desktop && echo [Desktop Running on port 5173] && python dev_server.py 5173"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo  All services started successfully!
echo   - Backend:  http://127.0.0.1:8000 (API & Docs: /docs)
echo   - Desktop:  http://localhost:5173
echo   - LinkedIn: http://localhost:5173/#linkedin
echo ========================================================
echo.
echo Launching your browser...
start http://localhost:5173/#linkedin

echo To stop CareerOS, simply close the opened Backend and Desktop windows.
echo.
pause
