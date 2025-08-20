# IT Asset Monitor with VNC Integration

A comprehensive IT asset monitoring system with integrated VNC remote access capabilities.

## 🚀 Features

### IT Asset Monitor
- **Real-time Computer Monitoring** - Track computer status, hardware, and software
- **IP Group Management** - Organize computers by network segments
- **Analytics Dashboard** - Visualize system health and trends
- **Alert System** - Get notified of system issues
- **Pinned Computers** - Quick access to important systems

### VNC Integration
- **Web-based VNC Viewer** - Access remote computers through browser
- **Quick Connect** - Predefined server connections
- **Custom Connections** - Connect to any VNC server
- **Integrated UI** - VNC management within the main application

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQL Server
- **Real-time**: WebSocket
- **VNC**: noVNC (WebSocket-based VNC)

## 📋 Prerequisites

- Node.js 18+
- Python 3.8+
- Git
- SQL Server (for IT Asset Monitor)
- VNC Server (for remote access)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
pip install websockify
```

### 2. Setup noVNC
```bash
setup-novnc-windows.bat
```

### 3. Start Backend
```bash
node server.js
```

### 4. Start Frontend
```bash
npm run dev
```

### 5. Access Application
- **IT Asset Monitor**: http://localhost:3000
- **VNC Viewer**: Available in the VNC tab

## 🔧 VNC Configuration

### Default Settings
- **VNC Server**: 10.51.101.83:5900
- **Password**: 123
- **Web Interface**: http://localhost:6081/vnc.html

### Quick Start VNC
```bash
start-novnc-windows.bat
```

### Custom VNC Server
```bash
python start-novnc-simple.py --vnc-host YOUR_IP --vnc-port 5900
```

## 📁 Project Structure

```
IT-Asset-Monitor/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── ...
├── server.js              # Backend server
├── start-novnc-simple.py  # VNC launcher
├── setup-novnc-windows.bat # VNC setup
└── start-novnc-windows.bat # VNC starter
```

## 🔌 API Endpoints

### IT Asset Monitor
- `GET /api/computers` - Get all computers
- `GET /api/ip-groups` - Get IP groups
- `GET /api/analytics` - Get analytics data
- `GET /api/alerts/:username` - Get user alerts

### VNC Integration
- `POST /api/vnc/start` - Start noVNC
- `GET /api/vnc/status` - Check noVNC status
- `POST /api/vnc/connect` - Connect to VNC server

## 🔒 Security

- **CORS Protection** - Configured for specific IP ranges
- **SQL Injection Protection** - Parameterized queries
- **VNC Password** - Default password: 123 (change in production)

## 🆘 Troubleshooting

### VNC Issues
1. **Check noVNC Status**: Look for "noVNC: Running" badge
2. **Verify VNC Server**: Ensure VNC server is running on target machine
3. **Check Ports**: Verify ports 5900 (VNC) and 6081 (noVNC) are available
4. **Password**: Use password "123" for default VNC servers

### Common Commands
```bash
# Check noVNC status
python start-novnc-simple.py

# Reinstall noVNC
setup-novnc-windows.bat

# Manual VNC connection
http://localhost:6081/vnc.html?host=10.51.101.83&port=5900
```

## 📝 License

This project is for internal use only.
