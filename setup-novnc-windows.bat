@echo off
echo ========================================
echo    noVNC Setup for Windows
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Python is installed. Checking version...
python --version

echo.
echo ========================================
echo    Installing noVNC dependencies
echo ========================================

REM Install websockify
echo Installing websockify...
pip install websockify

REM Check if noVNC directory exists
if not exist "noVNC" (
    echo Downloading noVNC...
    git clone https://github.com/novnc/noVNC.git
    if %errorlevel% neq 0 (
        echo ERROR: Failed to download noVNC!
        echo Please make sure Git is installed
        pause
        exit /b 1
    )
) else (
    echo noVNC directory already exists
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo To start noVNC proxy:
echo 1. Start your VNC server (e.g., TightVNC Server)
echo 2. Run: python utils/websockify/websockify.py 6081 localhost:5900
echo 3. Open browser to: http://localhost:6081/vnc.html
echo.
echo Or use the quick start script:
echo   cd noVNC
echo   python utils/novnc_proxy --vnc localhost:5900
echo.
pause
