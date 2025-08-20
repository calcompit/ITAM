@echo off
echo ========================================
echo    noVNC Test Script
echo ========================================
echo.

echo Checking noVNC installation...
echo.

REM Check if noVNC directory exists
if exist "noVNC" (
    echo ✅ noVNC directory found
) else (
    echo ❌ noVNC directory not found
    echo Please run: git clone https://github.com/novnc/noVNC.git
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed
    pause
    exit /b 1
) else (
    echo ✅ Python is installed
    python --version
)

REM Check if websockify is installed
python -c "import websockify" >nul 2>&1
if errorlevel 1 (
    echo ❌ websockify is not installed
    echo Please run: pip install websockify
    pause
    exit /b 1
) else (
    echo ✅ websockify is installed
)

echo.
echo Testing noVNC functionality...
echo.

REM Test noVNC startup
echo Starting noVNC test...
python start-novnc-simple.py --vnc-host 10.51.101.83 --vnc-port 5900 --web-port 6081

echo.
echo Test complete!
pause
