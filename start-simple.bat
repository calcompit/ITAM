@echo off
echo ========================================
echo    IT Asset Monitor - Simple Start
echo ========================================
echo.

echo Starting essential services...
echo.

echo 1. Starting Backend (Port 3002)...
start "Backend" cmd /k "node server.js"

echo 2. Starting Frontend (Port 8080)...
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ Services started!
echo.
echo 🌐 Access Dashboard: http://localhost:8080
echo.
echo 💡 VNC Usage:
echo - คลิก IP address ใน computer card
echo - ระบบจะเริ่ม noVNC อัตโนมัติ
echo - ใส่ password: 123
echo.
pause
