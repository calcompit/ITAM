@echo off
echo ========================================
echo    noVNC Remote Connection Launcher
echo ========================================
echo.

echo Available VNC servers:
echo 1. 10.51.101.83:5900 (default)
echo 2. 10.51.101.94:5900
echo 3. localhost:5900
echo 4. Custom IP and port
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Connecting to 10.51.101.83:5900...
    python start-novnc-simple.py --vnc-host 10.51.101.83 --vnc-port 5900
) else if "%choice%"=="2" (
    echo.
    echo Connecting to 10.51.101.94:5900...
    python start-novnc-simple.py --vnc-host 10.51.101.94 --vnc-port 5900
) else if "%choice%"=="3" (
    echo.
    echo Connecting to localhost:5900...
    python start-novnc-simple.py --vnc-host localhost --vnc-port 5900
) else if "%choice%"=="4" (
    echo.
    set /p custom_ip="Enter VNC server IP: "
    set /p custom_port="Enter VNC server port (default 5900): "
    if "%custom_port%"=="" set custom_port=5900
    echo.
    echo Connecting to %custom_ip%:%custom_port%...
    python start-novnc-simple.py --vnc-host %custom_ip% --vnc-port %custom_port%
) else if "%choice%"=="5" (
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
