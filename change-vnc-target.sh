#!/bin/bash

# Quick VNC Target Changer
# Usage: ./change-vnc-target.sh <new_ip> [new_port]

if [ $# -eq 0 ]; then
    echo "❌ Please provide target IP"
    echo "📝 Usage: ./change-vnc-target.sh <ip> [port]"
    echo "📝 Example: ./change-vnc-target.sh 10.51.104.105 5900"
    exit 1
fi

NEW_IP=$1
NEW_PORT=${2:-"5900"}

echo "🔄 Changing VNC target to $NEW_IP:$NEW_PORT..."

# Run the start script with new target
./start-vnc.sh $NEW_IP $NEW_PORT

echo ""
echo "🎉 VNC target changed successfully!"
echo "🌐 Open: http://localhost:6081/vnc.html"
