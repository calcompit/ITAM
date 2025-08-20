@echo off
echo Starting VNC Proxy Server...
echo.
echo Server will be available at: http://10.51.101.49:8081/vnc.html
echo.
echo Press Ctrl+C to stop the server
echo.

node vnc-proxy.js

pause
