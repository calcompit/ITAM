@echo off
echo ========================================
echo    IT Asset Monitor - Startup
echo ========================================
echo.

echo Starting all services...
echo.

echo 1. Starting Backend (Port 3002)...
start "Backend" cmd /k "node server.js"

echo 2. Starting Frontend (Port 8080)...
start "Frontend" cmd /k "npm run dev"

echo.
echo Services started!
echo.
echo Access URLs:
echo - Dashboard: http://localhost:8080
echo - Backend API: http://10.51.101.49:3002
echo.
echo To start VNC (when needed):
echo - Run: start-novnc.bat
echo.
pause
