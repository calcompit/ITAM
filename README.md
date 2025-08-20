# IT Asset Monitor

A comprehensive IT Asset Management system with real-time monitoring, analytics, and alerting capabilities.

## 🚀 Features

### Core Functionality
- **Real-time Asset Monitoring**: Live tracking of computer assets with automatic status updates
- **Dashboard Analytics**: Comprehensive overview with total, online, offline, and activated computer counts
- **IP Group Management**: Organized view by network subnets with detailed statistics
- **Computer Details**: Detailed information including hardware specs, OS details, and changelog history
- **User Authentication**: Secure login system with user-specific access
- **Alert System**: Personalized alerts for system changes with read/unread status tracking

### Technical Features
- **Realtime Updates**: SQL Server Service Broker + WebSocket for instant data synchronization
- **Connection Resilience**: Automatic retry logic and fallback data when database is unavailable
- **Responsive UI**: Modern interface built with React, TypeScript, and Tailwind CSS
- **Persistent State**: Remembers pinned computers and alert preferences across sessions
- **Copy Functionality**: Easy copying of machine IDs, computer names, and IP addresses

### Data Management
- **Hardware Monitoring**: CPU, RAM, Storage, GPU, and Network adapter tracking
- **OS Information**: Windows activation status, version, and installation details
- **Change History**: Detailed changelog with old/new value comparisons
- **Status Tracking**: Online/offline status based on last update time
- **IP Management**: Automatic IP address parsing and subnet grouping

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

### Database
- **SQL Server** with custom tables:
  - `TBL_IT_MachinesCurrent`: Current asset data
  - `TBL_IT_MachineChangeLog`: Change history
  - `TBL_IT_MAINTAINUSER`: User authentication

## 📋 Prerequisites

- Node.js 18+ 
- SQL Server 2019+
- Network access to SQL Server instance

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

### Starting the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Production build
npm run build
npm start
```

### Accessing the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### API Endpoints
- `GET /api/computers` - Get all computer assets
- `GET /api/ip-groups` - Get IP group statistics
- `GET /api/analytics` - Get analytics data
- `GET /api/alerts/:username` - Get user-specific alerts
- `POST /api/login` - User authentication
- `GET /api/health` - System health check

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
├── server.js          # Backend server
├── package.json       # Dependencies
└── README.md         # This file
```

### Key Components
- `Dashboard.tsx` - Main dashboard with statistics
- `Analytics.tsx` - Analytics and charts
- `AlertsPage.tsx` - Alert management
- `computer-card.tsx` - Individual computer display
- `computer-details-modal.tsx` - Detailed computer information

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

**IT Asset Monitor** - Comprehensive IT asset management with real-time monitoring and analytics.
