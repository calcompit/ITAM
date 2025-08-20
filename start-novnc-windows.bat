@echo off
echo ========================================
echo    noVNC Launcher for Windows
echo ========================================
echo.

echo Choose launcher method:
echo 1. Advanced launcher (with debugging)
echo 2. Simple launcher (recommended)
echo 3. Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Starting advanced noVNC launcher...
    if exist "start-novnc-windows.py" (
        python start-novnc-windows.py
    ) else (
        echo ERROR: start-novnc-windows.py not found!
        pause
        exit /b 1
    )
) else if "%choice%"=="2" (
    echo.
    echo Starting simple noVNC launcher...
    if exist "start-novnc-simple.py" (
        python start-novnc-simple.py
    ) else (
        echo ERROR: start-novnc-simple.py not found!
        pause
        exit /b 1
    )
) else if "%choice%"=="3" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo noVNC launcher finished.
pause
