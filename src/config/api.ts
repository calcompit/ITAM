// API Configuration
const getBackendUrl = () => {
  // Check environment variables first
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // Fallback based on NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    return 'http://100.117.205.41:3002';
  }
  return 'http://100.117.205.41:3002';
};

const getFrontendUrl = () => {
  // Check environment variables first
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // Fallback based on NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }
  return 'http://10.51.101.49:8081';
};

const getNovncUrl = () => {
  // Check environment variables first
  if (process.env.NOVNC_URL) {
    return process.env.NOVNC_URL;
  }
  
  // Fallback based on NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:6081';
  }
  return 'http://10.51.101.49:6081';
};

export const API_CONFIG = {
  // Backend server URL - Use environment variables
  BACKEND_URL: getBackendUrl(),
  
  // API endpoints
  API_BASE_URL: `${getBackendUrl()}/api`,
  
  // VNC endpoints
  VNC_STATUS: `${getBackendUrl()}/api/vnc/status`,
  VNC_START: `${getBackendUrl()}/api/vnc/start`,
  VNC_CONNECT: `${getBackendUrl()}/api/vnc/connect`,
  
  // noVNC web interface
  NOVNC_URL: getNovncUrl(),
  
  // Frontend URL
  FRONTEND_URL: getFrontendUrl(),
  
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
