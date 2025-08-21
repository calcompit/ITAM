@echo off

echo 🚀 Starting IT Asset Monitor - Windows Production Mode
echo ==================================================

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
call start-all.bat
