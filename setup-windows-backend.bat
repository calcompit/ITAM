@echo off
echo ========================================
echo    Windows Backend Setup Script
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "server.js" (
    echo ❌ server.js not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo ✅ Found server.js - we're in the right directory
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
) else (
    echo ✅ Python is installed
)

echo.
echo ========================================
echo    Setting up noVNC
echo ========================================
echo.

REM Check if noVNC directory exists
if exist "noVNC" (
    echo ✅ noVNC directory already exists
    echo.
    echo Checking noVNC structure...
    if exist "noVNC\core" (
        echo ✅ noVNC core directory found
    ) else (
        echo ❌ noVNC core directory not found
        echo Removing existing noVNC directory...
        rmdir /s /q noVNC
        echo.
        echo Cloning noVNC...
        git clone https://github.com/novnc/noVNC.git
    )
) else (
    echo ❌ noVNC directory not found
    echo.
    echo Cloning noVNC...
    git clone https://github.com/novnc/noVNC.git
)

echo.
echo Checking websockify installation...
python -c "import websockify" 2>nul
if errorlevel 1 (
    echo ❌ websockify is not installed
    echo Installing websockify...
    pip install websockify
) else (
    echo ✅ websockify is installed
)

echo.
echo ========================================
echo    Installing Node.js Dependencies
echo ========================================
echo.

REM Install npm dependencies
echo Installing npm dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install npm dependencies
    pause
    exit /b 1
) else (
    echo ✅ npm dependencies installed successfully
)

echo.
echo ========================================
echo    Testing noVNC Setup
echo ========================================
echo.

REM Test noVNC setup
echo Running noVNC test...
python test-simple.py
if errorlevel 1 (
    echo ❌ noVNC test failed
    echo Please check the error messages above
    pause
    exit /b 1
) else (
    echo ✅ noVNC test passed
)

echo.
echo ========================================
echo    Starting Backend Server
echo ========================================
echo.

echo Starting backend server on port 3002...
echo.
echo The backend will be accessible at:
echo - Backend API: http://10.51.101.49:3002
echo - noVNC: http://10.51.101.49:6081
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the backend server
node server.js

pause
