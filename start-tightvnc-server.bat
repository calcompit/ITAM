@echo off
echo Starting TightVNC Server...
echo.

REM Set the path to TightVNC Server
set TIGHTVNC_SERVER_PATH="C:\Program Files\TightVNC\tvnserver.exe"

REM Check if TightVNC Server exists
if not exist %TIGHTVNC_SERVER_PATH% (
    echo ERROR: TightVNC Server not found at %TIGHTVNC_SERVER_PATH%
    echo Please make sure TightVNC is installed correctly.
    pause
    exit /b 1
)

REM VNC server parameters
set VNC_PORT=5900
set VNC_PASSWORD=123

echo Starting TightVNC Server with parameters:
echo Port: %VNC_PORT%
echo Password: %VNC_PASSWORD%
echo.

REM Start TightVNC Server
echo Starting TightVNC Server...
%TIGHTVNC_SERVER_PATH% -port=%VNC_PORT% -password=%VNC_PASSWORD%

echo.
echo TightVNC Server stopped.
pause
