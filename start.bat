@echo off

echo 🚀 Starting IT Asset Monitor - Universal Windows Script
echo =====================================================

REM Detect if running on Windows and set environment
set PLATFORM=Windows
set NODE_ENV=production
set HOST=10.51.101.49
set BACKEND_URL=http://10.51.101.49:3002
set FRONTEND_URL=http://10.51.101.49:8081
set NOVNC_URL=http://10.51.101.49:6081
set PYTHON_CMD=python

echo 📱 Platform: %PLATFORM%
echo 🐍 Python Command: %PYTHON_CMD%
echo 🔗 Backend URL: %BACKEND_URL%
echo 🌐 Frontend URL: %FRONTEND_URL%
echo 🖥️  noVNC URL: %NOVNC_URL%
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if websockify is installed
python -c "import websockify" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing websockify...
    pip install websockify
)

REM Install npm dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    npm install
)

echo ✅ Dependencies checked
echo.

REM Kill any existing processes
echo 🔄 Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 🎯 Starting application...
echo.
echo Frontend will be available at: %FRONTEND_URL%
echo Backend will be available at: %BACKEND_URL%
echo WebSockify will be available at: %NOVNC_URL%
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start the application using npm script
npm run dev:full

pause
