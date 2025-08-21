@echo off

echo 🚀 Starting IT Asset Monitor - Windows Development Mode
echo ==================================================

REM Set environment variables for Windows
set NODE_ENV=development
set PYTHON_COMMAND=python
set BACKEND_URL=http://localhost:3002
set FRONTEND_URL=http://localhost:8080
set NOVNC_URL=http://localhost:6081

echo 📱 Platform: Windows
echo 🐍 Python Command: %PYTHON_COMMAND%
echo 🔗 Backend URL: %BACKEND_URL%
echo 🌐 Frontend URL: %FRONTEND_URL%
echo 🖥️  noVNC URL: %NOVNC_URL%
echo.

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

echo ✅ Dependencies checked
echo.

REM Start the application
echo 🎯 Starting application...
npm run dev:full
