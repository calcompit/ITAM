@echo off
echo ========================================
echo    noVNC Setup Script
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
echo Setup complete!
echo.
echo You can now run:
echo - test-websockify.py (to test noVNC)
echo - start.bat (to start the application)
echo.
pause
