// API Configuration
export const API_CONFIG = {
  // Backend server URL (Windows machine)
  BACKEND_URL: 'http://10.51.101.49:3002',
  
  // API endpoints
  API_BASE_URL: 'http://10.51.101.49:3002/api',
  
  // VNC endpoints
  VNC_STATUS: 'http://10.51.101.49:3002/api/vnc/status',
  VNC_START: 'http://10.51.101.49:3002/api/vnc/start',
  VNC_CONNECT: 'http://10.51.101.49:3002/api/vnc/connect',
  
  // noVNC web interface (Windows machine)
  NOVNC_URL: 'http://10.51.101.49:6081',
  
  // Frontend URL (MacBook)
  FRONTEND_URL: 'http://localhost:8081',
  
  // Default VNC settings
  DEFAULT_VNC_PORT: 5900,
  DEFAULT_NOVNC_PORT: 6081,
  DEFAULT_VNC_PASSWORD: '123'
};

// Helper function to build noVNC URL
export const buildNovncUrl = (host: string, port: number = 5900) => {
  return `${API_CONFIG.NOVNC_URL}/vnc-working.html?host=${host}&port=${port}&password=${API_CONFIG.DEFAULT_VNC_PASSWORD}`;
};
