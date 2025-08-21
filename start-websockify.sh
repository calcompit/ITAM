#!/bin/bash

# WebSockify Startup Script for IT Asset Monitor
# This script starts websockify for VNC connections

echo "Starting WebSockify for VNC connections..."

# Kill any existing websockify processes
echo "Stopping existing websockify processes..."
pkill -f websockify || true
sleep 2

# Change to noVNC directory
cd "$(dirname "$0")/noVNC"

# Check if noVNC directory exists
if [ ! -d "utils" ]; then
    echo "Error: noVNC directory not found. Please ensure noVNC is properly installed."
    exit 1
fi

# Start websockify on port 6081 (default noVNC port)
echo "Starting websockify on port 6081..."
python3 -m websockify 6081 --web . --verbose --log-file websockify.log &

# Wait a moment for websockify to start
sleep 3

# Check if websockify is running
if pgrep -f "websockify 6081" > /dev/null; then
    echo "WebSockify started successfully on port 6081"
    echo "VNC connections will be available at: http://10.51.101.49:6081"
else
    echo "Error: Failed to start websockify"
    exit 1
fi

echo "WebSockify is ready for VNC connections!"
