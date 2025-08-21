# Distributed Setup Guide

This guide explains how to run the IT Asset Monitor with the frontend on MacBook and backend on Windows.

## Architecture

- **Frontend (MacBook)**: React app running on `http://localhost:8080`
- **Backend (Windows)**: Node.js server running on `http://10.51.101.49:3002`
- **noVNC (Windows)**: VNC proxy running on `http://10.51.101.49:6081`

## Prerequisites

### MacBook (Frontend)
- Node.js (v16 or higher)
- Git

### Windows (Backend)
- Node.js (v16 or higher)
- Python (3.7 or higher)
- Git

## Setup Instructions

### Step 1: Frontend Setup (MacBook)

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/calcompit/ITAM.git
   cd ITAM
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the frontend**:
   ```bash
   npm run dev
   ```

4. **Verify frontend is running**:
   - Open `http://localhost:8080` in your browser
   - You should see the IT Asset Monitor dashboard

### Step 2: Backend Setup (Windows)

1. **SSH to Windows machine**:
   ```bash
   ssh dell-pc@10.51.101.49
   # Password: 010138258
   ```

2. **Navigate to project directory**:
   ```bash
   cd "C:\Users\Dell-PC\OneDrive\Documents\Itam"
   ```

3. **Pull latest changes**:
   ```bash
   git pull
   ```

4. **Run the setup script**:
   ```bash
   setup-windows-backend.bat
   ```

   This script will:
   - Check system requirements (Node.js, Python)
   - Set up noVNC
   - Install dependencies
   - Test noVNC functionality
   - Start the backend server

### Step 3: Verify Connection

1. **Check backend health**:
   ```bash
   curl http://10.51.101.49:3002/api/health
   ```

2. **Check noVNC status**:
   ```bash
   curl http://10.51.101.49:3002/api/vnc/status
   ```

3. **Test from frontend**:
   - Open `http://localhost:8080` on MacBook
   - Click on any IP address to test VNC connection
   - VNC should open at `http://10.51.101.49:6081`

## Troubleshooting

### Common Issues

#### 1. Frontend can't connect to backend
- **Check**: Backend is running on Windows
- **Solution**: Run `start-windows-backend.bat` on Windows

#### 2. noVNC not working
- **Check**: Run `troubleshoot-novnc.bat` on Windows
- **Common causes**:
  - Python/websockify not installed
  - Port 6081 in use
  - Windows Firewall blocking
  - Antivirus blocking Python

#### 3. VNC connection fails
- **Check**: Target VNC server is running
- **Test**: Try connecting to `10.51.101.83:5900` directly
- **Password**: Use `123` for VNC password

### Quick Commands

#### On MacBook (Frontend)
```bash
# Start frontend
npm run dev

# Check if frontend is running
curl http://localhost:8080
```

#### On Windows (Backend)
```bash
# First time setup
setup-windows-backend.bat

# Start backend only
start-windows-backend.bat

# Troubleshoot noVNC
troubleshoot-novnc.bat

# Check backend health
curl http://10.51.101.49:3002/api/health
```

## File Structure

```
IT-Asset-Monitor/
├── src/                    # Frontend (MacBook)
│   ├── config/api.ts      # Backend connection config
│   └── ...
├── server.js              # Backend server (Windows)
├── setup-windows-backend.bat    # Windows setup script
├── start-windows-backend.bat    # Windows start script
├── troubleshoot-novnc.bat       # noVNC troubleshooting
└── noVNC/                 # VNC proxy (Windows)
```

## Configuration Files

### Frontend Configuration (`src/config/api.ts`)
```typescript
export const API_CONFIG = {
  BACKEND_URL: 'http://10.51.101.49:3002',
  NOVNC_URL: 'http://10.51.101.49:6081',
  FRONTEND_URL: 'http://localhost:8080',
  // ...
};
```

### Backend Configuration (`server.js`)
- Database connection to `10.53.64.205`
- CORS allows connections from `10.51.x.x` and `localhost`
- noVNC runs on port 6081

## Security Notes

- Backend is accessible on the network at `10.51.101.49:3002`
- noVNC is accessible at `10.51.101.49:6081`
- Ensure Windows Firewall allows these ports
- Consider using HTTPS in production

## Development Workflow

1. **Make changes** on MacBook
2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. **Pull on Windows**:
   ```bash
   ssh dell-pc@10.51.101.49
   cd "C:\Users\Dell-PC\OneDrive\Documents\Itam"
   git pull
   ```
4. **Restart backend** if needed:
   ```bash
   start-windows-backend.bat
   ```

## Support

If you encounter issues:
1. Run `troubleshoot-novnc.bat` on Windows
2. Check the logs in the terminal
3. Verify network connectivity between MacBook and Windows
4. Ensure all required software is installed
