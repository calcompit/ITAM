@echo off
REM Windows batch file for running IT Asset Monitor with IP
REM Usage: run-windows.bat <IP> [full]
REM Example: run-windows.bat 10.51.101.49 full

setlocal enabledelayedexpansion

REM Get IP from command line argument
set IP=%1
set FULL_MODE=%2

if "%IP%"=="" (
    echo Usage: run-windows.bat ^<IP^> [full]
    echo Examples:
    echo   run-windows.bat 10.51.101.49
    echo   run-windows.bat 100.117.205.41 full
    echo   run-windows.bat localhost full
    pause
    exit /b 1
)

REM Determine environment based on IP
if "%IP%"=="localhost" (
    set NODE_ENV=development
    set FRONTEND_PORT=8080
) else (
    set NODE_ENV=production
    set FRONTEND_PORT=8081
)

REM Set environment variables
set HOST=%IP%
set BACKEND_URL=http://%IP%:3002
set FRONTEND_URL=http://%IP%:%FRONTEND_PORT%
set NOVNC_URL=http://%IP%:6081

echo 🚀 Starting IT Asset Monitor for IP: %IP%
echo 📊 Environment: %NODE_ENV%
echo 🌐 Backend: %BACKEND_URL%
echo 🎨 Frontend: %FRONTEND_URL%
echo 🖥️  VNC: %NOVNC_URL%

if "%FULL_MODE%"=="full" (
    echo 🔄 Running in full mode (server + frontend)...
    
    REM Run both server and frontend
    start "IT Asset Monitor Server" cmd /c "npm run server"
    timeout /t 2 /nobreak >nul
    start "IT Asset Monitor Frontend" cmd /c "npm run dev:frontend"
    
    echo ✅ Server and frontend started successfully!
    echo 📍 Backend: %BACKEND_URL%
    echo 📍 Frontend: %FRONTEND_URL%
    echo 📍 VNC: %NOVNC_URL%
    
) else (
    echo 🖥️  Running server only...
    
    REM Run server only
    npm run server
)

pause
