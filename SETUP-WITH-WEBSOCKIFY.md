# IT Asset Monitor - Setup with WebSockify

This guide explains how to run the IT Asset Monitor application with WebSockify for VNC connections on IP address `10.51.101.49`.

## Prerequisites

1. **Python 3** - Required for WebSockify
2. **Node.js** - Required for the backend server
3. **npm** - Required for frontend dependencies
4. **noVNC** - Already included in the project

## Installation

1. **Install Python dependencies:**
   ```bash
   pip3 install websockify
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

## Quick Start

### Option 1: Use the Complete Startup Script (Recommended)

```bash
# Start all services (Backend, Frontend, WebSockify)
./start-all-with-websockify.sh
```

### Option 2: Start Services Manually

1. **Start WebSockify:**
   ```bash
   ./start-websockify.sh
   ```

2. **Start Backend Server:**
   ```bash
   node server.js
   ```

3. **Start Frontend (in a new terminal):**
   ```bash
   npm run dev
   ```

## Access URLs

Once all services are running, you can access:

- **Frontend Dashboard:** http://10.51.101.49:8081
- **Backend API:** http://10.51.101.49:3002
- **WebSockify (VNC):** http://10.51.101.49:6081

## Stopping Services

### Option 1: Use the Stop Script
```bash
./stop-all.sh
```

### Option 2: Stop Manually
```bash
# Stop all processes
pkill -f websockify
pkill -f "node server.js"
pkill -f "npm run dev"
```

## Configuration Details

### IP Address Configuration
All services have been configured to use `10.51.101.49` instead of `localhost`:

- **API Configuration:** `src/config/api.ts`
- **WebSocket Service:** `src/services/websocket.ts`
- **Server Configuration:** `server.js`
- **noVNC Configuration:** `noVNC/vnc.html`

### Port Configuration
- **Frontend:** Port 8081
- **Backend API:** Port 3002
- **WebSockify:** Port 6081
- **VNC Sessions:** Ports 6082-6100 (dynamic)

## VNC Connection Process

1. **User clicks VNC button** on a computer card
2. **Backend creates VNC session** with WebSockify
3. **WebSockify proxy** forwards WebSocket connections to VNC server
4. **noVNC interface** opens in browser at `http://10.51.101.49:6081`

## Troubleshooting

### WebSockify Issues
- **Check if Python 3 is installed:** `python3 --version`
- **Check if websockify is installed:** `python3 -m websockify --help`
- **Check logs:** Look for `websockify.log` in the noVNC directory

### Port Conflicts
- **Check if ports are in use:** `lsof -i :6081` or `lsof -i :3002`
- **Kill conflicting processes:** Use the stop script or manually kill processes

### Network Issues
- **Check firewall settings** - Ensure ports 8081, 3002, and 6081 are open
- **Check network connectivity** - Ensure `10.51.101.49` is accessible

### VNC Connection Issues
- **Check target VNC server** - Ensure VNC server is running on target machine
- **Check VNC port** - Default is 5900, but may vary
- **Check VNC password** - Default is '123' in this setup

## Development vs Production

This setup is configured for production use with IP address `10.51.101.49`. For development:

1. Change IP addresses back to `localhost` in configuration files
2. Use `npm run dev` for frontend development
3. Use `node server.js` for backend development

## Security Notes

- **VNC Password:** Default is '123' - change in production
- **Network Access:** Ensure proper firewall rules
- **Authentication:** Implement proper user authentication for production
- **HTTPS:** Use HTTPS in production environments

## Support

For issues or questions:
1. Check the logs in the noVNC directory
2. Verify all services are running on correct ports
3. Check network connectivity to `10.51.101.49`
