@echo off
echo ========================================
echo    Connection Test
echo ========================================
echo.

echo Testing connections...
echo.

echo 1. Testing Backend (Port 3002)...
curl -s http://10.51.101.49:3002/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not running
)

echo.
echo 2. Testing Frontend (Port 8080)...
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running
) else (
    echo ❌ Frontend is not running
)

echo.
echo 3. Testing noVNC (Port 6081)...
curl -s http://localhost:6081 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ noVNC is running
) else (
    echo ❌ noVNC is not running
)

echo.
echo 4. Testing VNC Server (10.51.101.83:5900)...
telnet 10.51.101.83 5900 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ VNC Server is accessible
) else (
    echo ❌ VNC Server is not accessible
)

echo.
echo ========================================
echo    Test Complete
echo ========================================
echo.
pause
