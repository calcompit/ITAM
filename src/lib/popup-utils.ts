// Popup blocking detection and handling utilities
import { isSafari, isFirefox, isChrome, isEdge } from './browser-detection';

export interface PopupBlockResult {
  isBlocked: boolean;
  browser: string;
  solution: string;
  manualUrl?: string;
  alternativeSolutions?: string[];
}

export interface VNCLink {
  id: string;
  computerName: string;
  ip: string;
  url: string;
  timestamp: number;
}

// Detect browser type
export function detectBrowser(): string {
  if (isSafari()) return 'safari';
  if (isFirefox()) return 'firefox';
  if (isChrome()) return 'chrome';
  if (isEdge()) return 'edge';
  return 'unknown';
}

// Improved popup blocking detection
export function detectPopupBlock(windowRef: Window | null): PopupBlockResult {
  const browser = detectBrowser();
  
  // More reliable detection method
  const isBlocked = !windowRef || 
                   windowRef.closed || 
                   typeof windowRef.closed === 'undefined' ||
                   windowRef.outerHeight === 0 ||
                   windowRef.outerWidth === 0;

  let solution = '';
  let alternativeSolutions: string[] = [];
  
  switch (browser) {
    case 'chrome':
      solution = 'คลิกที่ไอคอน 🚫 ในแถบที่อยู่ แล้วเลือก "อนุญาต" สำหรับ popup';
      alternativeSolutions = [
        'ใช้ VNC Viewer แอปพลิเคชัน (แนะนำ)',
        'คัดลอก URL และเปิดในแท็บใหม่',
        'ตั้งค่า "Allow popups" ใน Chrome Settings'
      ];
      break;
    case 'firefox':
      solution = 'คลิกที่ไอคอน 🚫 ในแถบที่อยู่ แล้วเลือก "อนุญาต" สำหรับ popup';
      alternativeSolutions = [
        'ใช้ VNC Viewer แอปพลิเคชัน (แนะนำ)',
        'ตั้งค่า "Allow popups" ใน Firefox Settings',
        'เพิ่มเว็บไซต์ใน whitelist'
      ];
      break;
    case 'safari':
      solution = 'ไปที่ Safari > Preferences > Websites > Pop-up Windows แล้วเลือก "Allow" สำหรับเว็บไซต์นี้';
      alternativeSolutions = [
        'ใช้ VNC Viewer แอปพลิเคชัน (แนะนำ)',
        'เปิด Safari Preferences และอนุญาต popup',
        'ใช้ Command+Click เพื่อเปิดในแท็บใหม่'
      ];
      break;
    case 'edge':
      solution = 'คลิกที่ไอคอน 🚫 ในแถบที่อยู่ แล้วเลือก "อนุญาต" สำหรับ popup';
      alternativeSolutions = [
        'ใช้ VNC Viewer แอปพลิเคชัน (แนะนำ)',
        'ตั้งค่า "Allow popups" ใน Edge Settings',
        'เพิ่มเว็บไซต์ใน whitelist'
      ];
      break;
    default:
      solution = 'กรุณาอนุญาต popup ในเบราว์เซอร์ของคุณ';
      alternativeSolutions = [
        'ใช้ VNC Viewer แอปพลิเคชัน (แนะนำ)',
        'ตั้งค่าเบราว์เซอร์ให้อนุญาต popup',
        'ติดต่อผู้ดูแลระบบ'
      ];
  }

  return {
    isBlocked,
    browser,
    solution,
    alternativeSolutions
  };
}

// Create manual VNC link
export function createVNCLink(computerName: string, ip: string, url: string): VNCLink {
  return {
    id: `vnc_${ip.replace(/\./g, '_')}_${Date.now()}`,
    computerName,
    ip,
    url,
    timestamp: Date.now()
  };
}

// Store VNC links in localStorage
export function storeVNCLink(link: VNCLink): void {
  try {
    const existingLinks = getStoredVNCLinks();
    const updatedLinks = [link, ...existingLinks].slice(0, 10); // Keep only last 10
    localStorage.setItem('vnc_links', JSON.stringify(updatedLinks));
  } catch (error) {
    console.error('Failed to store VNC link:', error);
  }
}

// Get stored VNC links
export function getStoredVNCLinks(): VNCLink[] {
  try {
    const links = localStorage.getItem('vnc_links');
    return links ? JSON.parse(links) : [];
  } catch (error) {
    console.error('Failed to get stored VNC links:', error);
    return [];
  }
}

// Remove VNC link
export function removeVNCLink(linkId: string): void {
  try {
    const existingLinks = getStoredVNCLinks();
    const updatedLinks = existingLinks.filter(link => link.id !== linkId);
    localStorage.setItem('vnc_links', JSON.stringify(updatedLinks));
  } catch (error) {
    console.error('Failed to remove VNC link:', error);
  }
}

// Clear old VNC links (older than 1 hour)
export function clearOldVNCLinks(): void {
  try {
    const existingLinks = getStoredVNCLinks();
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const updatedLinks = existingLinks.filter(link => link.timestamp > oneHourAgo);
    localStorage.setItem('vnc_links', JSON.stringify(updatedLinks));
  } catch (error) {
    console.error('Failed to clear old VNC links:', error);
  }
}

// Enhanced window opening with better popup detection
export function openVNCPopup(url: string, computerName: string, ip: string): PopupBlockResult {
  const browser = detectBrowser();
  const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no,directories=no,left=100,top=100';
  
  // Try multiple approaches for different browsers
  let windowRef: Window | null = null;
  
  try {
    // Method 1: Standard approach
    const uniqueName = `vnc_${ip.replace(/\./g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    windowRef = window.open(url, uniqueName, windowFeatures);
    
    // Method 2: If blocked, try with different name
    if (!windowRef || windowRef.closed) {
      const fallbackName = `vnc_fallback_${Date.now()}`;
      windowRef = window.open(url, fallbackName, windowFeatures);
    }
    
    // Method 3: For Safari, try without features
    if ((!windowRef || windowRef.closed) && browser === 'safari') {
      windowRef = window.open(url, '_blank');
    }
    
  } catch (error) {
    console.error('Error opening VNC window:', error);
  }
  
  const result = detectPopupBlock(windowRef);
  
  // If blocked, store the link for manual access
  if (result.isBlocked) {
    const link = createVNCLink(computerName, ip, url);
    storeVNCLink(link);
  }
  
  return result;
}

// Try to open VNC in native app
export function openVNCNativeApp(ip: string, port: number = 5900): void {
  const vncUrl = `vnc://:123@${ip}:${port}`;
  console.log('Opening VNC in native app:', vncUrl);
  window.open(vncUrl, '_blank');
}

// Copy VNC URL to clipboard
export async function copyVNCUrlToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
