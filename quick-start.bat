@echo off
echo ========================================
echo    IT Asset Monitor - Quick Start
echo ========================================
echo.

echo Step 1: Testing websockify...
python test-simple.py

if errorlevel 1 (
    echo.
    echo ❌ Websockify test failed!
    echo Please fix the issues above before continuing.
    pause
    exit /b 1
)

echo.
echo ✅ Websockify test passed!
echo.

echo Step 2: Starting application...
echo.

echo Starting backend server...
start "Backend" cmd /k "node server.js"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo 🎉 Application started successfully!
echo.
echo 📋 Access URLs:
echo - Frontend: http://localhost:8080
echo - Backend: http://localhost:3002
echo - noVNC: http://localhost:6081
echo.
echo 🖱️  How to use VNC:
echo 1. Open http://localhost:8080
echo 2. Click any IP address on a computer card
echo 3. noVNC will start automatically
echo 4. Use password: 123
echo.
echo Press any key to exit...
pause >nul
