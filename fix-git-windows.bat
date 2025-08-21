@echo off

echo 🔧 Fixing Git Issues - Windows
echo =============================

echo.
echo Checking Git status...
git status

echo.
echo Resetting noVNC submodule...
cd noVNC
git reset --hard HEAD
git clean -fd
cd ..

echo.
echo Checking main repository status...
git status

echo.
echo Stashing any remaining changes...
git stash

echo.
echo Pulling latest changes...
git pull origin main

echo.
echo ✅ Git issues fixed!
echo.
echo You can now run the application:
echo - start-windows-simple.bat
echo - start-windows-separate.bat
echo - start-windows-powershell.ps1
echo.
pause
