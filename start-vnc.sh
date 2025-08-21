#!/bin/bash

# Simple VNC Starter Script
# Usage: ./start-vnc.sh <target_ip> [target_port]

TARGET_IP=${1:-"172.17.124.179"}
TARGET_PORT=${2:-"5900"}
VNC_PORT="6081"

echo "🎯 Starting VNC for $TARGET_IP:$TARGET_PORT on port $VNC_PORT"

# Kill existing websockify
echo "🛑 Killing existing websockify..."
pkill -f "websockify.*$VNC_PORT" 2>/dev/null || echo "No existing websockify to kill"

# Wait a moment
sleep 1

# Start new websockify
echo "🚀 Starting websockify for $TARGET_IP:$TARGET_PORT..."
websockify $VNC_PORT $TARGET_IP:$TARGET_PORT --web noVNC --verbose &

# Wait for websockify to start
sleep 2

# Check if websockify is running
if pgrep -f "websockify.*$VNC_PORT" > /dev/null; then
    echo "✅ Websockify started successfully!"
    echo "🌐 VNC URL: http://localhost:$VNC_PORT/vnc.html"
    echo "🎮 Target: $TARGET_IP:$TARGET_PORT"
    echo ""
    echo "📝 To change target, run: ./start-vnc.sh <new_ip> [new_port]"
    echo "🛑 To stop, run: pkill -f 'websockify.*$VNC_PORT'"
else
    echo "❌ Failed to start websockify"
    exit 1
fi
