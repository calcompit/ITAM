@echo off
echo Starting IT Asset Monitor System...
echo.

REM Kill any existing processes
echo Killing existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
echo Checking dependencies...
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

REM Start the application
echo Starting application...
echo.
echo Frontend will be available at: http://localhost:8081
echo Backend will be available at: http://localhost:3002
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start the application using npm script
npm run dev:full

pause

