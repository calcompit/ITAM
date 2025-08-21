@echo off
echo ========================================
echo IT Asset Monitor - Windows Setup
echo ========================================
echo.

REM Check if Python is installed
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3 from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Python is installed. Installing websockify...
echo.

REM Install websockify
pip install websockify

if errorlevel 1 (
    echo Error: Failed to install websockify
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo.
echo WebSockify installed successfully!
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed.
echo.

REM Install npm dependencies
echo Installing npm dependencies...
npm install

if errorlevel 1 (
    echo Error: Failed to install npm dependencies
    pause
    exit /b 1
)

echo.
echo All dependencies installed successfully!
echo.

REM Start the application
echo Starting application...
echo.
echo Frontend will be available at: http://10.51.101.49:8081
echo Backend will be available at: http://10.51.101.49:3002
echo WebSockify will be available at: http://10.51.101.49:6081
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start the application using start-all.bat
call start-all.bat
