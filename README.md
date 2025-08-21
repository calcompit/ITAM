# IT Asset Monitor

A comprehensive IT asset monitoring system with VNC remote access capabilities.

## Quick Start

### Development Scripts

The project now supports multiple environment configurations:

#### For macOS (localhost):
```bash
npm run mac
```
- **Backend**: http://localhost:3002
- **Frontend**: http://localhost:8080
- **VNC**: http://localhost:6081

#### For Windows 10 (10.51.101.49):
```bash
npm run win10
```
- **Backend**: http://10.51.101.49:3002
- **Frontend**: http://10.51.101.49:8081
- **VNC**: http://10.51.101.49:6081

#### For Windows 100 (100.117.205.41):
```bash
npm run win100
```
- **Backend**: http://100.117.205.41:3002
- **Frontend**: http://100.117.205.41:8081
- **VNC**: http://100.117.205.41:6081

### Individual Server Scripts

You can also run just the backend server for each environment:

```bash
# macOS
npm run server:mac

# Windows 10
npm run server:win10

# Windows 100
npm run server:win100
```

### Legacy Scripts

```bash
# Original development (uses environment variables)
npm run dev:full

# Frontend only
npm run dev

# Backend only
npm run server
```

## �� Platform Support

### macOS (Development Mode)
- **Host**: localhost
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3002
- **VNC**: http://localhost:6081

### Windows (Production Mode)
- **Host**: 10.51.101.49
- **Frontend**: http://10.51.101.49:8081
- **Backend**: http://10.51.101.49:3002
- **VNC**: http://10.51.101.49:6081

## 🔧 Features

- **Real-time Asset Monitoring**: Monitor computers and network devices
- **VNC Remote Access**: Secure remote desktop connections
- **Cross-platform Support**: Works on macOS, Windows, and Linux
- **Database Integration**: SQL Server connectivity
- **WebSocket Real-time Updates**: Live data synchronization
- **Responsive UI**: Modern, mobile-friendly interface

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.7 or higher)
- **SQL Server** (for database connectivity)
- **websockify** (for VNC proxy)

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/calcompit/ITAM.git
   cd ITAM
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install websockify**:
   ```bash
   pip install websockify
   ```

## 🎯 Usage

### Start the application:
```bash
npm run dev:full
```

The application will automatically:
- Start backend server (port 3002)
- Start frontend development server (port 8080/8081)
- Configure VNC proxy (port 6081)
- Set appropriate environment variables based on platform

## 🔗 Access URLs

After starting the application, access:

- **Dashboard**: http://localhost:8080 (macOS) or http://10.51.101.49:8081 (Windows)
- **Backend API**: http://localhost:3002 (macOS) or http://10.51.101.49:3002 (Windows)
- **VNC Proxy**: http://localhost:6081 (macOS) or http://10.51.101.49:6081 (Windows)

## 🗄️ Database Configuration

Configure your SQL Server connection in environment variables:

```env
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
DB_SERVER=your_server_ip
```

## 🔒 VNC Security

- VNC sessions require authentication
- Sessions timeout after 30 minutes of inactivity
- Single session per user policy
- Secure WebSocket connections

## 🛡️ Troubleshooting

### Common Issues:

1. **Port conflicts**: Ensure ports 3002, 8080/8081, and 6081 are available
2. **Database connection**: Verify SQL Server credentials and network connectivity
3. **VNC not working**: Check if websockify is installed and Python is accessible
4. **Permission denied**: Run scripts with appropriate permissions

### Platform-specific:

**macOS**:
- Use `python3` instead of `python`
- Ensure Xcode command line tools are installed

**Windows**:
- Run as Administrator if needed
- Disable Windows Defender Firewall for development
- Use `python` command (not `python3`)

**Environment Variables**:
- The application automatically detects the platform and sets appropriate environment variables
- For development: uses localhost
- For production: uses server IP (10.51.101.49)

## 📝 Available Scripts

- **npm run dev:full**: Start both backend and frontend
- **npm run server**: Start backend only
- **npm run dev**: Start frontend only
- **npm run build**: Build for production
- **npm run preview**: Preview production build

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both platforms
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
