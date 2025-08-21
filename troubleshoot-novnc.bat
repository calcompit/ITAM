@echo off
echo ========================================
echo    noVNC Troubleshooting Script
echo ========================================
echo.

echo Checking system requirements...
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed
    echo Please install Python from https://python.org/
    goto :end
) else (
    echo ✅ Python is installed
)

REM Check websockify
python -c "import websockify" 2>nul
if errorlevel 1 (
    echo ❌ websockify is not installed
    echo Installing websockify...
    pip install websockify
    if errorlevel 1 (
        echo ❌ Failed to install websockify
        goto :end
    )
) else (
    echo ✅ websockify is installed
)

REM Check noVNC directory
if not exist "noVNC" (
    echo ❌ noVNC directory not found
    echo Cloning noVNC...
    git clone https://github.com/novnc/noVNC.git
    if errorlevel 1 (
        echo ❌ Failed to clone noVNC
        goto :end
    )
) else (
    echo ✅ noVNC directory found
)

REM Check noVNC structure
if not exist "noVNC\core" (
    echo ❌ noVNC core directory not found
    echo Removing and re-cloning noVNC...
    rmdir /s /q noVNC
    git clone https://github.com/novnc/noVNC.git
) else (
    echo ✅ noVNC core directory found
)

echo.
echo ========================================
echo    Testing Port Availability
echo ========================================
echo.

REM Check if port 6081 is in use
netstat -an | findstr ":6081" >nul
if not errorlevel 1 (
    echo ❌ Port 6081 is already in use
    echo Killing processes on port 6081...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":6081"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    echo ✅ Killed processes on port 6081
) else (
    echo ✅ Port 6081 is available
)

echo.
echo ========================================
echo    Testing noVNC Functionality
echo ========================================
echo.

echo Running noVNC test...
python test-simple.py
if errorlevel 1 (
    echo ❌ noVNC test failed
    echo.
    echo ========================================
    echo    Manual Testing Steps
    echo ========================================
    echo.
    echo 1. Try running websockify manually:
    echo    cd noVNC
    echo    python -m websockify 6081 10.51.101.83:5900 --verbose
    echo.
    echo 2. Check if the target VNC server is running:
    echo    Test connection to 10.51.101.83:5900
    echo.
    echo 3. Check Windows Firewall settings:
    echo    - Allow Python through firewall
    echo    - Allow port 6081 through firewall
    echo.
    echo 4. Check antivirus software:
    echo    - Add Python and the project folder to exclusions
    echo.
) else (
    echo ✅ noVNC test passed
    echo.
    echo ========================================
    echo    noVNC is working correctly!
    echo ========================================
    echo.
    echo You can now:
    echo 1. Start the backend: start-windows-backend.bat
    echo 2. Access noVNC at: http://10.51.101.49:6081
    echo 3. Connect from frontend at: http://localhost:8080
)

:end
echo.
echo ========================================
echo    Troubleshooting Complete
echo ========================================
echo.
pause
