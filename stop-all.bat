@echo off
echo Stopping IT Asset Monitor System...
echo.

REM Kill Node.js processes
echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

REM Kill Python websockify processes
echo Stopping Python websockify processes...
taskkill /f /im python.exe >nul 2>&1

REM Kill any remaining processes
echo Cleaning up remaining processes...
taskkill /f /im "npm.exe" >nul 2>&1
taskkill /f /im "concurrently.exe" >nul 2>&1

echo.
echo All processes stopped successfully!
echo.
pause

