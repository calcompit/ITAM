#!/bin/bash

echo "🚀 Starting IT Asset Monitor..."
echo "📊 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:8083 (or check terminal for actual port)"
echo ""
echo "✨ Features:"
echo "   • Machine ID with scrollable display and copy button"
echo "   • Persistent login (remembers user session)"
echo "   • Real-time online status (10-minute threshold)"
echo "   • Thailand timezone (UTC+7) display"
echo "   • Alert status instead of warning"
echo "   • 4-digit IP grouping (10.51.101.x)"
echo "   • Login with SQL Server authentication"
echo "   • Private system - login required"
echo "   • Real-time analytics dashboard"
echo "   • Fixed Win_Activated detection (1/0/NULL)"
echo "   • Fixed IP groups online/offline status"
echo "   • Copy computer name and machine ID (no modal)"
echo "   • Search by computer name and machine ID"
echo "   • Click computer name to copy (larger text)"
echo "   • Fixed Windows activation status detection"
echo "   • Windows activation info in Total Computers card"
echo "   • Pinned moved to 2nd position in menu"
echo "   • Fixed changelog modal display"
echo "   • Fixed modal crash when clicking computer cards"
echo "   • Thailand time conversion optimized (SQL Server side)"
echo "   • IP Group view shows stats overview (no search filter)"
echo "   • Click computer name to copy (no modal)"
echo "   • Realtime updates every 30 seconds"
echo "   • Fixed timezone conversion (C# time → correct Thailand time display)"
echo "   • Added Last Updated time to computer cards"
echo "   • Added offline duration display for offline computers"
echo "   • Fixed online/offline status calculation across all pages"
echo "   • Added relative time display (Today, Yesterday, X hours ago)"
echo "   • Made online status more strict (5 minutes instead of 10)"
echo "   • Combined status and time in single line (Online just now)"
echo "   • Fixed online/offline status calculation (now working correctly)"
echo "   • Unified time display across all components (card, modal, alerts)"
echo "   • Added realtime SQL Server push notifications (Service Broker + WebSocket)"
echo ""

# Kill any existing processes
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Start the application
npm run dev:full