#!/bin/bash

echo "🛑 Stopping all processes..."

# Kill all Node.js processes (backend)
echo "📱 Stopping Node.js processes..."
pkill -f "node server.js" 2>/dev/null || echo "No Node.js processes to stop"

# Kill all npm processes (frontend)
echo "🌐 Stopping npm processes..."
pkill -f "npm run dev" 2>/dev/null || echo "No npm processes to stop"

# Kill all websockify processes
echo "🔌 Stopping websockify processes..."
pkill -f "websockify.*6081" 2>/dev/null || echo "No websockify processes to stop"

# Kill all Python VNC proxy processes
echo "🐍 Stopping Python VNC proxy processes..."
pkill -f "vnc-proxy-manager.py" 2>/dev/null || echo "No Python VNC proxy processes to stop"

# Remove PID files
rm -f .backend.pid .frontend.pid .vnc.pid 2>/dev/null

echo "✅ All processes stopped"
