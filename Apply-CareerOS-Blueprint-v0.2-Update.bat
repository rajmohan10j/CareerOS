@echo off
setlocal EnableExtensions

REM ===== CONFIGURE THESE PATHS IF NEEDED =====
set "PROJECT_ROOT=C:\Users\Raj\Projects\CareerOS"
set "BLUEPRINT_ROOT=C:\Users\Raj\Projects\CareerOS-Blueprint"
set "ZIP_FILE=%~dp0CareerOS-Blueprint-v0.2-Update-Pack.zip"
set "SUMMARY_FILE=%~dp0CareerOS-Blueprint-v0.2-Update-Summary.docx"

echo.
echo ============================================
echo CareerOS Blueprint v0.2 Update Installer
echo ============================================
echo.

if not exist "%PROJECT_ROOT%" (
    echo ERROR: Project folder not found:
    echo %PROJECT_ROOT%
    pause
    exit /b 1
)

mkdir "%BLUEPRINT_ROOT%\Releases" 2>nul
mkdir "%BLUEPRINT_ROOT%\Archive" 2>nul
mkdir "%BLUEPRINT_ROOT%\v0.2" 2>nul

if not exist "%ZIP_FILE%" (
    echo ERROR: ZIP file not found:
    echo %ZIP_FILE%
    pause
    exit /b 1
)

echo Extracting update pack...
powershell -NoProfile -Command ^
"Expand-Archive -LiteralPath '%ZIP_FILE%' -DestinationPath '%BLUEPRINT_ROOT%\v0.2' -Force"

if exist "%SUMMARY_FILE%" (
    copy /Y "%SUMMARY_FILE%" "%BLUEPRINT_ROOT%\Releases\" >nul
)

echo.
echo Merging updated files into CareerOS...
robocopy "%BLUEPRINT_ROOT%\v0.2\CareerOS-Blueprint-v0.2-Update-Pack" "%PROJECT_ROOT%" /E /R:1 /W:1 >nul

echo.
echo ============================================
echo Update Complete
echo ============================================
echo.
echo Blueprint: %BLUEPRINT_ROOT%\v0.2
echo Project:   %PROJECT_ROOT%
echo.
echo Review changes with:
echo    git status
echo Then commit:
echo    git add .
echo    git commit -m "docs: apply Blueprint v0.2 update"
echo.
pause
