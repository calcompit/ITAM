# IT Asset Monitor with VNC Integration

A simple IT asset monitoring dashboard with integrated VNC remote access functionality.

## Features

- **Asset Monitoring**: View computer assets with IP addresses
- **VNC Remote Access**: Click any IP address to connect via noVNC
- **Real-time Status**: Monitor online/offline status of computers

## Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Python** (for noVNC)
3. **noVNC** (already cloned)
4. **websockify** (already installed)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   # Terminal 1: Start backend
   node server.js
   
   # Terminal 2: Start frontend
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend: http://localhost:3002

## Usage

### VNC Connection

1. **Open the dashboard** at http://localhost:8080
2. **Click any IP address** on a computer card
3. **noVNC will automatically start** and open in a new tab
4. **Enter password: `123`** when prompted

### Ports Used

- **Frontend**: 8080
- **Backend**: 3002  
- **noVNC**: 6081
- **VNC Server**: 5900

## Troubleshooting

### VNC Not Working?

1. **Check noVNC installation:**
   ```bash
   ls noVNC/
   ```

2. **Check websockify:**
   ```bash
   python -c "import websockify"
   ```

3. **Check backend logs** for VNC startup messages

### Common Issues

- **"noVNC directory not found"**: Run `git clone https://github.com/novnc/noVNC.git`
- **"websockify not found"**: Run `pip install websockify`
- **Port 6081 in use**: Kill existing noVNC processes

## Development

### Project Structure

```
├── src/                    # Frontend React app
│   ├── pages/             # Page components
│   ├── components/        # UI components
│   └── config/           # API configuration
├── server.js              # Backend server
├── noVNC/                 # noVNC installation
└── package.json           # Dependencies
```

### API Endpoints

- `POST /api/vnc/start` - Start noVNC for an IP
- `GET /api/vnc/status` - Check noVNC status
- `GET /api/computers` - Get computer assets

## License

MIT
