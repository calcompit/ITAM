#!/bin/bash

echo "🚀 Starting IT Asset Monitor - Universal Script"
echo "=============================================="

# Detect platform and set environment
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 Platform: macOS"
    export NODE_ENV=development
    export HOST=localhost
    export BACKEND_URL=http://localhost:3002
    export FRONTEND_URL=http://localhost:8080
    export NOVNC_URL=http://localhost:6081
    PYTHON_CMD="python3"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash)
    echo "📱 Platform: Windows (Git Bash)"
    export NODE_ENV=production
    export HOST=10.51.101.49
    export BACKEND_URL=http://10.51.101.49:3002
    export FRONTEND_URL=http://10.51.101.49:8081
    export NOVNC_URL=http://10.51.101.49:6081
    PYTHON_CMD="python"
else
    # Linux
    echo "📱 Platform: Linux"
    export NODE_ENV=development
    export HOST=localhost
    export BACKEND_URL=http://localhost:3002
    export FRONTEND_URL=http://localhost:8080
    export NOVNC_URL=http://localhost:6081
    PYTHON_CMD="python3"
fi

echo "🐍 Python Command: $PYTHON_CMD"
echo "🔗 Backend URL: $BACKEND_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🖥️  noVNC URL: $NOVNC_URL"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "❌ Error: Python is not installed"
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi

# Check if websockify is installed
if ! $PYTHON_CMD -c "import websockify" &> /dev/null; then
    echo "📦 Installing websockify..."
    pip install websockify
fi

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "✅ Dependencies checked"
echo ""

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "websockify" 2>/dev/null || true
sleep 2

echo "🎯 Starting application..."
echo ""
echo "Frontend will be available at: $FRONTEND_URL"
echo "Backend will be available at: $BACKEND_URL"
echo "WebSockify will be available at: $NOVNC_URL"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start the application using npm script
npm run dev:full
