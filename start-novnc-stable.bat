@echo off
echo ========================================
echo    Stable noVNC Startup Script
echo ========================================
echo.

REM Kill any existing websockify processes
echo Killing existing websockify processes...
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 >nul

echo Starting stable websockify...
echo.

:start_loop
echo [%date% %time%] Starting websockify...
cd /d "C:\Users\Dell-PC\OneDrive\Documents\Itam\noVNC"

REM Start websockify with better error handling
python -m websockify 6081 10.51.101.83:5900 --web . --verbose --log-file websockify.log

echo [%date% %time%] Websockify stopped, restarting in 5 seconds...
timeout /t 5 >nul
goto start_loop
