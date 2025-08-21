#!/bin/bash

echo "🚀 Starting IT Asset Monitor - Mac Development Mode"
echo "=================================================="

# Set environment variables for Mac
export NODE_ENV=development
export PYTHON_COMMAND=python3
export BACKEND_URL=http://localhost:3002
export FRONTEND_URL=http://localhost:8080
export NOVNC_URL=http://localhost:6081

echo "📱 Platform: macOS"
echo "🐍 Python Command: $PYTHON_COMMAND"
echo "🔗 Backend URL: $BACKEND_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🖥️  noVNC URL: $NOVNC_URL"
echo ""

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python3 is not installed"
    echo "Please install Python3: brew install python3"
    exit 1
fi

# Check if websockify is installed
if ! python3 -c "import websockify" &> /dev/null; then
    echo "📦 Installing websockify..."
    pip3 install websockify
fi

echo "✅ Dependencies checked"
echo ""

# Start the application
echo "🎯 Starting application..."
npm run dev:full
