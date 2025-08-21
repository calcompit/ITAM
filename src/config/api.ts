// API Configuration
export const API_CONFIG = {
  // Backend server URL (development: localhost, production: 10.51.101.49)
  BACKEND_URL: process.env.NODE_ENV === 'production' ? 'http://10.51.101.49:3002' : 'http://localhost:3002',
  
  // API endpoints
  API_BASE_URL: process.env.NODE_ENV === 'production' ? 'http://10.51.101.49:3002/api' : 'http://localhost:3002/api',
  
  // VNC endpoints
  VNC_STATUS: process.env.NODE_ENV === 'production' ? 'http://10.51.101.49:3002/api/vnc/status' : 'http://localhost:3002/api/vnc/status',
  VNC_START: process.env.NODE_ENV === 'production' ? 'http://10.51.101.49:3002/api/vnc/start' : 'http://localhost:3002/api/vnc/start',
  VNC_CONNECT: process.env.NODE_ENV === 'production' ? 'http://10.51.101.49:3002/api/vnc/connect' : 'http://localhost:3002/api/vnc/connect',
  
  // noVNC web interface (development: localhost, production: 10.51.101.49)
  NOVNC_URL: process.env.NODE_ENV === 'production' ? 'http://10.51.101.49:6081' : 'http://localhost:6081',
  
  // Frontend URL (development: localhost, production: 10.51.101.49)
  FRONTEND_URL: process.env.NODE_ENV === 'production' ? 'http://10.51.101.49:8081' : 'http://localhost:8081',
  
  // Default VNC settings
  DEFAULT_VNC_PORT: 5900,
  DEFAULT_NOVNC_PORT: 6081,
  DEFAULT_VNC_PASSWORD: '123'
};

// Helper function to build noVNC URL and open in new window
export const buildNovncUrl = (host: string, port: number = 5900) => {
  const url = `${API_CONFIG.NOVNC_URL}/vnc-module.html?host=${host}&port=${port}&password=${API_CONFIG.DEFAULT_VNC_PASSWORD}`;
  
  // Open in new window with specific features for better VNC experience
  const windowFeatures = 'width=1200,height=800,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no';
  window.open(url, '_blank', windowFeatures);
  
  return url;
};
