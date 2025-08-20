@echo off
echo ========================================
echo    noVNC Launcher for Windows
echo ========================================
echo.

REM Check if Python script exists
if not exist "start-novnc-windows.py" (
    echo ERROR: start-novnc-windows.py not found!
    echo Please make sure the file is in the current directory
    pause
    exit /b 1
)

echo Starting noVNC using Python script...
echo.

REM Start noVNC using Python script
python start-novnc-windows.py

echo.
echo noVNC launcher finished.
pause
