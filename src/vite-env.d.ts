/// <reference types="vite/client" />

// Extend Window interface for VNC window management
declare global {
  interface Window {
    vncWindow?: Window | null;
    vncWindows?: Window[];
  }
}
