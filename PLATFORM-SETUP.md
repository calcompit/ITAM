# 🚀 Platform-Specific Setup Guide

## 📱 macOS Development

### Quick Start
```bash
chmod +x start-dev-mac.sh
./start-dev-mac.sh
```

### Manual Setup
```bash
# Install Python3
brew install python3

# Install websockify
pip3 install websockify

# Set environment
export NODE_ENV=development
export PYTHON_COMMAND=python3

# Start application
npm run dev:full
```

### Access URLs
- 🌐 **Frontend**: http://localhost:8080
- 🔗 **Backend**: http://localhost:3002
- 🖥️ **noVNC**: http://localhost:6081

---

## 🪟 Windows Development

### Quick Start
```cmd
start-dev-windows.bat
```

### Manual Setup
```cmd
# Install Python from https://www.python.org/downloads/
# Make sure to check "Add Python to PATH"

# Install websockify
pip install websockify

# Set environment
set NODE_ENV=development
set PYTHON_COMMAND=python

# Start application
npm run dev:full
```

### Access URLs
- 🌐 **Frontend**: http://localhost:8080
- 🔗 **Backend**: http://localhost:3002
- 🖥️ **noVNC**: http://localhost:6081

---

## 🖥️ Windows Production (Server)

### Quick Start
```cmd
start-prod-windows.bat
```

### Manual Setup
```cmd
# Install Python from https://www.python.org/downloads/
# Make sure to check "Add Python to PATH"

# Install websockify
pip install websockify

# Set environment
set NODE_ENV=production
set PYTHON_COMMAND=python

# Start application
start-all.bat
```

### Access URLs
- 🌐 **Frontend**: http://10.51.101.49:8081
- 🔗 **Backend**: http://10.51.101.49:3002
- 🖥️ **noVNC**: http://10.51.101.49:6081

---

## 🔧 Troubleshooting

### macOS Issues
1. **Python3 not found**: `brew install python3`
2. **Permission denied**: `chmod +x start-dev-mac.sh`
3. **Port already in use**: `lsof -ti:3002 | xargs kill -9`

### Windows Issues
1. **Python not found**: Install Python and add to PATH
2. **Permission denied**: Run as Administrator
3. **Port already in use**: `netstat -ano | findstr :3002`

### Common Issues
1. **Websockify not installed**: `pip install websockify`
2. **Database connection**: Check firewall settings
3. **VNC connection**: Ensure target machine has VNC server running

---

## 📋 Environment Variables

| Variable | macOS Dev | Windows Dev | Windows Prod |
|----------|-----------|-------------|--------------|
| NODE_ENV | development | development | production |
| PYTHON_COMMAND | python3 | python | python |
| BACKEND_URL | localhost:3002 | localhost:3002 | 10.51.101.49:3002 |
| FRONTEND_URL | localhost:8080 | localhost:8080 | 10.51.101.49:8081 |
| NOVNC_URL | localhost:6081 | localhost:6081 | 10.51.101.49:6081 |
