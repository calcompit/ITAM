#!/bin/bash

echo "🛑 Killing all processes..."

# Kill all Node.js processes (backend)
echo "📱 Killing Node.js processes..."
pkill -f "node server.js" 2>/dev/null || echo "No Node.js processes to kill"

# Kill all npm processes (frontend)
echo "🌐 Killing npm processes..."
pkill -f "npm run dev" 2>/dev/null || echo "No npm processes to kill"

# Kill all websockify processes
echo "🔌 Killing websockify processes..."
pkill -f "websockify.*6081" 2>/dev/null || echo "No websockify processes to kill"

# Kill all Python VNC proxy processes
echo "🐍 Killing Python VNC proxy processes..."
pkill -f "vnc-proxy-manager.py" 2>/dev/null || echo "No Python VNC proxy processes to kill"

# Wait a moment
sleep 2

echo "✅ All processes killed"
echo ""
echo "🚀 Starting everything fresh..."

# Start backend
echo "📱 Starting backend server..."
node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Start VNC with default target
echo "🔌 Starting VNC with default target..."
./start-vnc.sh 172.17.124.179 5900 &
VNC_PID=$!

# Wait for VNC to start
sleep 3

echo ""
echo "🎉 All services started!"
echo "📱 Backend: http://localhost:3000"
echo "🌐 Frontend: http://localhost:8082"
echo "🔌 VNC: http://localhost:6081/vnc.html"
echo ""
echo "💡 To change VNC target from dashboard, click on any IP address"
echo "💡 Or manually: ./change-vnc-target.sh <ip> <port>"
echo ""
echo "🛑 To stop everything: ./stop-all.sh"

# Save PIDs for later use
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid
echo $VNC_PID > .vnc.pid
