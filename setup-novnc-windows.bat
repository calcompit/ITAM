@echo off
echo ========================================
echo    noVNC Setup for Windows
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please download and install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo ✅ Python is installed
python --version

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please download and install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git is installed
git --version
echo.

REM Install websockify
echo Installing websockify...
pip install websockify
if errorlevel 1 (
    echo ERROR: Failed to install websockify!
    echo Try running: pip install websockify --user
    pause
    exit /b 1
)

echo ✅ websockify installed successfully
echo.

REM Check if noVNC directory already exists
if exist "noVNC" (
    echo noVNC directory already exists
    echo.
    echo Options:
    echo 1. Use existing installation
    echo 2. Remove and reinstall
    echo 3. Exit
    echo.
    set /p choice="Enter your choice (1-3): "
    
    if "%choice%"=="2" (
        echo Removing existing noVNC directory...
        rmdir /s /q noVNC
        echo ✅ Removed existing directory
    ) else if "%choice%"=="3" (
        echo Setup cancelled
        pause
        exit /b 0
    ) else (
        echo Using existing installation
        goto :verify_installation
    )
)

REM Download noVNC
echo Downloading noVNC...
git clone https://github.com/novnc/noVNC.git
if errorlevel 1 (
    echo ERROR: Failed to download noVNC!
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo ✅ noVNC downloaded successfully
echo.

:verify_installation
REM Verify installation
echo Verifying noVNC installation...
if not exist "noVNC" (
    echo ERROR: noVNC directory not found after installation!
    pause
    exit /b 1
)

echo ✅ noVNC directory created

REM Check for essential files
if exist "noVNC\utils\websockify\websockify.py" (
    echo ✅ websockify.py found
) else if exist "noVNC\utils\websockify.py" (
    echo ✅ websockify.py found (alternative location)
) else (
    echo ⚠️  websockify.py not found in expected locations
    echo This might be normal for newer noVNC versions
)

if exist "noVNC\vnc.html" (
    echo ✅ vnc.html found
) else (
    echo ⚠️  vnc.html not found in root directory
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start your VNC server (port 5900)
echo 2. Run: start-novnc-windows.bat
echo 3. Open: http://localhost:6081/vnc.html
echo.
echo For troubleshooting, run:
echo python start-novnc-windows.py
echo.
pause
