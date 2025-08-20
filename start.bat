@echo off
echo ========================================
echo    IT Asset Monitor with VNC
echo ========================================
echo.

echo Starting backend server...
start "Backend" cmd /k "node server.js"

echo.
echo Starting frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo Application starting...
echo - Backend: http://localhost:3002
echo - Frontend: http://localhost:8080
echo - noVNC: http://localhost:6081
echo.
echo Press any key to exit...
pause >nul
