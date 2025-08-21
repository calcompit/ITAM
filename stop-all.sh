#!/bin/bash

# IT Asset Monitor - Stop All Services
# This script stops the backend server, frontend, and websockify

echo "=========================================="
echo "IT Asset Monitor - Stopping All Services"
echo "=========================================="

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    echo "Stopping $service_name on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Stop services
kill_port 3002 "Backend Server"
kill_port 8081 "Frontend"
kill_port 6081 "WebSockify"

# Kill any remaining websockify processes
echo "Stopping any remaining websockify processes..."
pkill -f websockify || true

# Kill any node processes related to our app
echo "Stopping any remaining Node.js processes..."
pkill -f "node server.js" || true
pkill -f "npm run dev" || true

sleep 2

echo ""
echo "=========================================="
echo "All services stopped successfully!"
echo "=========================================="
