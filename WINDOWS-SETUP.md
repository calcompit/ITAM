# IT Asset Monitor - Windows Setup

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Add to PATH during installation

2. **Python** (v3.8 or higher)
   - Download from: https://python.org/
   - Add to PATH during installation

3. **websockify** (for VNC)
   - Install via pip: `pip install websockify`

## Quick Start

### Option 1: Using Batch Files (Recommended)

1. **Start the application:**
   ```
   Double-click: start-all.bat
   ```

2. **Stop the application:**
   ```
   Double-click: stop-all.bat
   ```

### Option 2: Using Command Line

1. **Install dependencies:**
   ```cmd
   npm install
   ```

2. **Start the application:**
   ```cmd
   npm run dev:full
   ```

3. **Stop the application:**
   ```cmd
   Ctrl + C
   ```

## Access URLs

- **Frontend:** http://localhost:8081
- **Backend API:** http://localhost:3002
- **VNC Connections:** http://localhost:6081-6100

## Features

- ✅ **Multi-user VNC support** - Up to 20 concurrent sessions
- ✅ **Auto-connect VNC** - No password required (uses 123)
- ✅ **Real-time updates** - WebSocket-based data updates
- ✅ **Session management** - Auto-cleanup and user kick
- ✅ **Silent operation** - No terminal output from websockify

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
1. Run `stop-all.bat` to kill all processes
2. Wait 2-3 seconds
3. Run `start-all.bat` again

### VNC Not Opening
If VNC windows don't open:
1. Check browser popup blocker settings
2. Allow popups for localhost
3. Try clicking the manual VNC links

### Database Connection Issues
If you see "demo data":
1. Check database server connectivity
2. Verify SQL Server is running
3. Check firewall settings

## File Structure

```
IT-Asset-Monitor/
├── start-all.bat          # Start everything
├── stop-all.bat           # Stop everything
├── server.js              # Backend server
├── src/                   # Frontend React app
├── noVNC/                 # VNC client files
└── package.json           # Dependencies
```

## Support

For issues or questions, check the main README.md file.
