@echo off
echo ========================================
echo    Start noVNC
echo ========================================
echo.

echo Starting noVNC proxy...
echo VNC Server: 10.51.101.83:5900
echo Web Interface: http://localhost:6081/vnc.html
echo Password: 123
echo.

python start-novnc-simple.py

echo.
echo noVNC stopped.
pause
