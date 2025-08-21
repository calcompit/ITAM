@echo off
echo ========================================
echo    Starting Windows Backend Server
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "server.js" (
    echo ❌ server.js not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo ✅ Found server.js
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ node_modules not found. Please run setup-windows-backend.bat first.
    pause
    exit /b 1
)

echo ✅ Dependencies found
echo.

echo Starting backend server on port 3002...
echo.
echo The backend will be accessible at:
echo - Backend API: http://10.51.101.49:3002
echo - noVNC: http://10.51.101.49:6081
echo.
echo Frontend should connect from: http://localhost:8080 (MacBook)
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the backend server
node server.js

pause
