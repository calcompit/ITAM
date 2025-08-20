# IT Asset Monitor

A comprehensive IT Asset Management system with real-time monitoring, analytics, alerting capabilities, and VNC launcher functionality.

## 🚀 Features

### Core IT Asset Management
- **Real-time Asset Monitoring**: Live tracking of computer assets with automatic status updates
- **Dashboard Analytics**: Comprehensive overview with total, online, offline, and activated computer counts
- **IP Group Management**: Organized view by network subnets with detailed statistics
- **Computer Details**: Detailed information including hardware specs, OS details, and changelog history
- **User Authentication**: Secure login system with user-specific access
- **Alert System**: Personalized alerts for system changes with read/unread status tracking

### VNC Launcher
- 🚀 **TightVNC Launcher** - Automatically launch TightVNC viewer with connection parameters
- 🌐 **Web Interface** - Beautiful web interface for launching VNC connections
- 📋 **Manual Commands** - Copy-paste commands for manual VNC connections
- 🔧 **Server-side Launch** - Launch VNC from server-side for better compatibility
- 📱 **Responsive Design** - Works on desktop and mobile devices

### Technical Features
- **Realtime Updates**: SQL Server Service Broker + WebSocket for instant data synchronization
- **Connection Resilience**: Automatic retry logic and fallback data when database is unavailable
- **Responsive UI**: Modern interface built with React, TypeScript, and Tailwind CSS
- **Persistent State**: Remembers pinned computers and alert preferences across sessions
- **Copy Functionality**: Easy copying of machine IDs, computer names, and IP addresses

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **Node.js** with Express.js
- **MSSQL** for database connectivity
- **WebSocket** for real-time communication
- **SQL Server Service Broker** for push notifications

### VNC Launcher
- **Node.js** HTTP server
- **WebSocket** for real-time communication
- **Child Process** for launching external applications

### Database
- **SQL Server** with custom tables:
  - `TBL_IT_MachinesCurrent`: Current asset data
  - `TBL_IT_MachineChangeLog`: Change history
  - `TBL_IT_MAINTAINUSER`: User authentication

## 📋 Prerequisites

- Node.js 18+
- SQL Server 2019+
- Network access to SQL Server instance
- TightVNC Viewer installed on Windows machines (for VNC functionality)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/calcompit/ITAM.git
   cd ITAM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_SERVER=your_sql_server_ip
   DB_NAME=your_database_name
   PORT=3001
   
   # VNC Cloud API Configuration (optional)
   VNC_API_KEY=your-API-key
   VNC_API_SECRET=your-API-secret
   ```

4. **Start the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

## 🚀 Usage

### IT Asset Monitor

#### Starting the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Production build
npm run build
npm start
```

#### Accessing the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

#### API Endpoints
- `GET /api/computers` - Get all computer assets
- `GET /api/ip-groups` - Get IP group statistics
- `GET /api/analytics` - Get analytics data
- `GET /api/alerts/:username` - Get user-specific alerts
- `POST /api/login` - User authentication
- `GET /api/health` - System health check

### VNC Launcher

#### Starting the VNC Launcher Server
```bash
node vnc-proxy-simple.js
```

#### Accessing the VNC Launcher
```
http://localhost:8081/vnc.html
```

#### VNC Launcher Endpoints
- `GET /vnc.html` - Main VNC launcher page
- `GET /vnc.html?ip=...&port=...&password=...` - VNC launcher with parameters
- `GET /launch-vnc?ip=...&port=...&password=...` - Server-side VNC launch
- `GET /check-tightvnc` - Check TightVNC installation
- `GET /create-vnc-static?allowedActions=...&groups=...` - Create VNC Cloud static address
- `GET /vnc-cloud-status?staticAddress=...` - Get VNC Cloud connection status
- `GET /favicon.ico` - Favicon
- `GET /robots.txt` - Robots file

#### URL Parameters
You can specify connection parameters in the URL:
```
http://localhost:8081/vnc.html?ip=192.168.1.100&port=5900&password=mypassword
```

Parameters:
- `ip` - Target machine IP address (default: 10.51.101.83)
- `port` - VNC port (default: 5900)
- `password` - VNC password (default: 123)

#### Manual Commands
If the automatic launch doesn't work, you can use manual commands:

**Windows Command Prompt:**
```cmd
"C:\Program Files\TightVNC\tvnviewer.exe" -host=192.168.1.100 -port=5900 -password=mypassword
```

**PowerShell:**
```powershell
& "C:\Program Files\TightVNC\tvnviewer.exe" -host=192.168.1.100 -port=5900 -password=mypassword
```

## 📊 Features Overview

### Dashboard
- Real-time computer count statistics
- Online/offline status monitoring
- Windows activation status tracking
- Quick access to pinned computers

### Computer Management
- Detailed hardware specifications
- Real-time status updates
- Change history with diff view
- Copy functionality for IDs and names

### IP Groups
- Network subnet organization
- Per-subnet statistics
- Filtered computer views
- Status aggregation

### Alerts System
- User-specific notifications
- Read/unread status tracking
- Historical alert viewing
- Change detail information

### Analytics
- Hardware distribution charts
- CPU type analysis
- RAM and storage statistics
- Activation status overview

### VNC Launcher
- Web interface for launching VNC connections
- Automatic TightVNC viewer launch
- Manual command generation
- Server-side VNC launching

## 🔒 Security Features

- **User Authentication**: Database-based user management
- **Session Persistence**: Secure login state management
- **Data Validation**: Input sanitization and validation
- **Error Handling**: Graceful error management without data exposure

## 🛡️ Connection Resilience

The application includes robust connection handling:
- **Automatic Retry**: 10 retry attempts with 5-second intervals
- **Fast Timeout**: 3-second connection timeout for quick failure detection
- **Fallback Data**: Sample data when database is unavailable
- **Health Monitoring**: Real-time connection status tracking

## 📝 Development

### Project Structure
```
IT-Asset-Monitor/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
├── server.js          # Backend server (IT Asset Monitor)
├── vnc-proxy-simple.js # VNC launcher server
├── package.json       # Dependencies
└── README.md         # This file
```

### Key Components
- `Dashboard.tsx` - Main dashboard with statistics
- `Analytics.tsx` - Analytics and charts
- `AlertsPage.tsx` - Alert management
- `computer-card.tsx` - Individual computer display
- `computer-details-modal.tsx` - Detailed computer information

### VNC Launcher Endpoints
- `GET /vnc.html` - Main VNC launcher page
- `GET /vnc.html?ip=...&port=...&password=...` - VNC launcher with parameters
- `GET /launch-vnc?ip=...&port=...&password=...` - Server-side VNC launch
- `GET /favicon.ico` - Favicon
- `GET /robots.txt` - Robots file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🔄 Updates

The system automatically updates when:
- New computer data is detected
- Changes are made to existing assets
- Database connectivity is restored
- User interactions occur

---

**IT Asset Monitor** - Comprehensive IT asset management with real-time monitoring, analytics, and VNC launcher functionality.
