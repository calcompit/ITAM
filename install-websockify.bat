@echo off
echo Installing WebSockify for IT Asset Monitor...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3 from https://www.python.org/downloads/
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
echo You can now run start-all.bat to start the application
echo.
pause
