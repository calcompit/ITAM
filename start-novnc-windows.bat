@echo off
echo ========================================
echo    noVNC Launcher for Windows
echo ========================================
echo.

REM Check if noVNC directory exists
if not exist "noVNC" (
    echo ERROR: noVNC directory not found!
    echo Please run setup-novnc-windows.bat first
    pause
    exit /b 1
)

REM Change to noVNC directory
cd noVNC

echo Starting noVNC proxy...
echo.
echo Configuration:
echo - Web interface: http://localhost:6081/vnc.html
echo - VNC server: localhost:5900
echo - WebSocket proxy: localhost:6081
echo.

REM Start noVNC proxy
python utils/novnc_proxy --vnc localhost:5900 --listen localhost:6081

echo.
echo noVNC proxy stopped.
pause
