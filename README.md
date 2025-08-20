# IT Asset Monitor with VNC Integration

A simple IT asset monitoring dashboard with integrated VNC remote access functionality.

## Features

- **Asset Monitoring**: View computer assets with IP addresses
- **VNC Remote Access**: Click any IP address to connect via noVNC
- **Real-time Status**: Monitor online/offline status of computers
- **Analytics Dashboard**: Hardware and software analysis
- **Alert System**: System notifications and change tracking

## Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Python** (for noVNC)
3. **Git** (for cloning noVNC)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup noVNC:**
   ```bash
   # Windows
   setup-novnc.bat
   
   # Manual setup
   git clone https://github.com/novnc/noVNC.git
   pip install websockify
   ```

3. **Test websockify:**
   ```bash
   # Use the simple test (recommended)
   python test-simple.py
   
   # Or use the full test
   python test-websockify.py
   ```

4. **Start the application:**
   ```bash
   # Quick start (recommended)
   quick-start.bat
   
   # Manual start
   start.bat
   
   # Or start separately
   # Terminal 1: Backend
   node server.js
   
   # Terminal 2: Frontend
   npm run dev
   ```

5. **Access the application:**
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

1. **Test websockify first:**
   ```bash
   python test-simple.py
   ```

2. **If test fails, run setup:**
   ```bash
   setup-novnc.bat
   ```

3. **Check backend logs** for VNC startup messages

### Common Issues

- **"noVNC directory not found"**: Run `setup-novnc.bat`
- **"websockify not found"**: Run `pip install websockify`
- **Port 6081 in use**: Kill existing noVNC processes
- **Test fails**: Use `python test-simple.py` instead of `test-websockify.py`

## Development

### Project Structure

```
├── src/                    # Frontend React app
│   ├── pages/             # Page components
│   ├── components/        # UI components
│   └── config/           # API configuration
├── server.js              # Backend server
├── noVNC/                 # noVNC installation
├── setup-novnc.bat        # noVNC setup script
├── test-simple.py         # Simple websockify test
├── test-websockify.py     # Full websockify test
├── quick-start.bat        # Quick start script
└── start.bat              # Application startup script
```

### API Endpoints

- `POST /api/vnc/start` - Start noVNC for an IP
- `GET /api/vnc/status` - Check noVNC status
- `GET /api/computers` - Get computer assets

## License

MIT
