@echo off

echo 🚀 Starting IT Asset Monitor - Windows Simple Mode
echo ================================================

REM Set environment variables for Production
set NODE_ENV=production
set PYTHON_COMMAND=python
set BACKEND_URL=http://10.51.101.49:3002
set FRONTEND_URL=http://10.51.101.49:8081
set NOVNC_URL=http://10.51.101.49:6081

echo 📱 Platform: Windows Production
echo 🐍 Python Command: %PYTHON_COMMAND%
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

REM Start the application
echo 🎯 Starting application...
echo.
echo Frontend will be available at: %FRONTEND_URL%
echo Backend will be available at: %BACKEND_URL%
echo WebSockify will be available at: %NOVNC_URL%
echo.
echo Starting backend server...
echo.

REM Start backend server first
npm run server

echo.
echo Backend server stopped. Press any key to exit...
pause >nul
