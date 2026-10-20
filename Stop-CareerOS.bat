@echo off
setlocal enabledelayedexpansion

title Stop CareerOS
echo ========================================================
echo               Stopping CareerOS Services
echo ========================================================
echo.

echo Stopping processes listening on ports 8000 and 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Terminating Backend (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Terminating Desktop (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo CareerOS services have been stopped.
echo.
timeout /t 2 /nobreak >nul
