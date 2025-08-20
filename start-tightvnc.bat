@echo off
echo Starting TightVNC Viewer...
echo.

REM Set the path to TightVNC
set TIGHTVNC_PATH="C:\Program Files\TightVNC\tvnviewer.exe"

REM Check if TightVNC exists
if not exist %TIGHTVNC_PATH% (
    echo ERROR: TightVNC not found at %TIGHTVNC_PATH%
    echo Please make sure TightVNC is installed correctly.
    pause
    exit /b 1
)

REM VNC connection parameters
set VNC_IP=10.51.101.83
set VNC_PORT=5900
set VNC_PASSWORD=123

echo Connecting to VNC server:
echo IP: %VNC_IP%
echo Port: %VNC_PORT%
echo Password: %VNC_PASSWORD%
echo.

REM Start TightVNC with connection parameters
echo Starting TightVNC Viewer...
%TIGHTVNC_PATH% -host=%VNC_IP% -port=%VNC_PORT% -password=%VNC_PASSWORD%

echo.
echo TightVNC Viewer closed.
pause
