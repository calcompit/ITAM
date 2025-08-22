@echo off
REM Deploy script for Windows PC
REM This script should be run on Windows PC (dell-pc@10.51.101.49)

setlocal enabledelayedexpansion

REM Configuration
set GIT_REPO=https://github.com/calcompit/ITAM.git
set PROJECT_PATH=C:\Users\Dell-PC\OneDrive\Documents\itam
set BRANCH=main

REM Colors for output (Windows 10+ supports ANSI colors)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

echo %BLUE%[INFO]%NC% Starting deployment on Windows PC...
echo %BLUE%[INFO]%NC% Project path: %PROJECT_PATH%

REM Check if project directory exists
if not exist "%PROJECT_PATH%" (
    echo %YELLOW%[WARNING]%NC% Project directory does not exist. Cloning repository...
    git clone %GIT_REPO% "%PROJECT_PATH%"
    if errorlevel 1 (
        echo %RED%[ERROR]%NC% Failed to clone repository
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%NC% Repository cloned successfully
) else (
    echo %BLUE%[INFO]%NC% Project directory exists. Pulling latest changes...
    cd /d "%PROJECT_PATH%"
    git pull origin %BRANCH%
    if errorlevel 1 (
        echo %RED%[ERROR]%NC% Failed to pull latest changes
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%NC% Latest changes pulled successfully
)

REM Install dependencies
echo %BLUE%[INFO]%NC% Installing dependencies...
cd /d "%PROJECT_PATH%"
npm install
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Failed to install dependencies
    pause
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Dependencies installed successfully

REM Check if server is running and stop it
echo %BLUE%[INFO]%NC% Checking if server is running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo %YELLOW%[WARNING]%NC% Node.js process found. Stopping server...
    taskkill /F /IM node.exe
    timeout /t 3 /nobreak >nul
    echo %GREEN%[SUCCESS]%NC% Server stopped
) else (
    echo %BLUE%[INFO]%NC% No Node.js process found
)

REM Start the server
echo %BLUE%[INFO]%NC% Starting server...
cd /d "%PROJECT_PATH%"
start "IT Asset Monitor Server" cmd /c "npm run dev"

echo %GREEN%[SUCCESS]%NC% Deployment completed successfully!
echo %BLUE%[INFO]%NC% Server should be running on http://10.51.101.49:3002
echo %BLUE%[INFO]%NC% Frontend should be running on http://10.51.101.49:8081

pause
