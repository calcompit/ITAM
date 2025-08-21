#!/bin/bash

# IT Asset Monitor - Complete Startup Script with WebSockify
# This script starts the backend server, frontend, and websockify

echo "=========================================="
echo "IT Asset Monitor - Complete Startup"
echo "=========================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "Stopping process on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Kill existing processes
echo "Stopping existing processes..."
kill_port 3002  # Backend
kill_port 8081  # Frontend
kill_port 6081  # WebSockify

# Kill any websockify processes
pkill -f websockify || true
sleep 3

echo "Starting services..."

# 1. Start WebSockify first
echo "1. Starting WebSockify..."
cd "$(dirname "$0")/noVNC"
if [ -d "utils" ]; then
    python3 -m websockify 6081 --web . --verbose --log-file websockify.log &
    WEBSOCKIFY_PID=$!
    echo "WebSockify started with PID: $WEBSOCKIFY_PID"
    sleep 3
    
    if ! check_port 6081; then
        echo "Error: WebSockify failed to start on port 6081"
        exit 1
    fi
else
    echo "Warning: noVNC directory not found. WebSockify will be started by the backend."
fi

# 2. Start Backend Server
echo "2. Starting Backend Server..."
cd "$(dirname "$0")"
node server.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 5
if ! check_port 3002; then
    echo "Error: Backend failed to start on port 3002"
    exit 1
fi

# 3. Start Frontend
echo "3. Starting Frontend..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 10
if ! check_port 8081; then
    echo "Error: Frontend failed to start on port 8081"
    exit 1
fi

echo ""
echo "=========================================="
echo "All services started successfully!"
echo "=========================================="
echo "Frontend: http://10.51.101.49:8081"
echo "Backend API: http://10.51.101.49:3002"
echo "WebSockify: http://10.51.101.49:6081"
echo ""
echo "Process IDs:"
echo "- Backend: $BACKEND_PID"
echo "- Frontend: $FRONTEND_PID"
echo "- WebSockify: $WEBSOCKIFY_PID"
echo ""
echo "To stop all services, run: ./stop-all.sh"
echo "=========================================="

# Keep script running and handle cleanup on exit
trap 'echo "Stopping all services..."; kill $BACKEND_PID $FRONTEND_PID $WEBSOCKIFY_PID 2>/dev/null; pkill -f websockify; exit' INT TERM

# Wait for user to stop
echo "Press Ctrl+C to stop all services..."
wait
