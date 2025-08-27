import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink } from 'lucide-react';
import { API_CONFIG } from '../config/api';

interface VNCViewerProps {
  isOpen: boolean;
  onClose: () => void;
  ip: string;
  port?: number;
  computerName?: string;
}

export function VNCViewer({ isOpen, onClose, ip, port = 5900, computerName }: VNCViewerProps) {

  const handleVNCApp = () => {
    // Try to open VNC in native app with password
    const vncUrl = `vnc://:123@${ip}:${port}`;
    console.log('Opening VNC URL:', vncUrl);
    
    // Detect if running on Mac
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    if (isMac) {
      // For Mac, try to open in native VNC app first
      window.open(vncUrl, '_blank');
    } else {
      // For other platforms, use web VNC
      handleWebVNC();
    }
  };

  const handleWebVNC = () => {
    // Open in new window for web VNC using the Windows proxy server - Force new window, not tab
    // Add Thai keyboard layout parameters
    const webVncUrl = `${API_CONFIG.NOVNC_URL}/vnc.html?ip=${ip}&port=${port}&password=123&keyboardLayout=th&language=th&encoding=UTF-8`;
    
    // Detect browser for better popup handling
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // For Mac, try multiple approaches
    if (isMac) {
      // Method 1: Try with minimal features first
      let windowRef = window.open(webVncUrl, `vnc_${Date.now()}`, 'width=1200,height=800');
      
      // Method 2: If blocked, try without features
      if (!windowRef || windowRef.closed) {
        windowRef = window.open(webVncUrl, '_blank');
      }
      
      // Method 3: If still blocked, try with user interaction
      if (!windowRef || windowRef.closed) {
        // Create a temporary button to trigger user interaction
        const tempButton = document.createElement('button');
        tempButton.style.display = 'none';
        tempButton.onclick = () => {
          window.open(webVncUrl, '_blank');
        };
        document.body.appendChild(tempButton);
        tempButton.click();
        document.body.removeChild(tempButton);
      }
      
      // Method 4: Final fallback - redirect in same window
      if (!windowRef || windowRef.closed) {
        console.error('All popup methods failed, redirecting in same window');
        window.location.href = webVncUrl;
      }
    } else {
      // For non-Mac, use standard approach
      const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no,directories=no,left=100,top=100';
      const windowRef = window.open(webVncUrl, `vnc_${Date.now()}`, windowFeatures);
      
      if (!windowRef || windowRef.closed) {
        console.error('VNC popup was blocked');
        window.location.href = webVncUrl;
      }
    }
  };

  // Auto-open VNC when dialog opens - FAST
  React.useEffect(() => {
    if (isOpen) {
      // Immediate VNC opening for fastest connection
      setTimeout(() => {
        // Detect platform and use appropriate method
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isMac && isSafari) {
          // For Mac Safari, use native VNC app
          handleVNCApp();
        } else if (isMac) {
          // For Mac non-Safari, use web VNC with user interaction
          // Don't auto-close, let user click manually
          console.log('Mac detected, waiting for user interaction');
        } else {
          // For other platforms/browsers, use web VNC
          handleWebVNC();
          onClose();
        }
      }, 100); // Reduced to 100ms for faster response
    }
  }, [isOpen, ip, port]); // Add ip and port as dependencies

  // Show VNC URL when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Just show the URL, don't auto-open
      console.log('VNC URL:', `vnc://:123@${ip}:${port}`);
    }
  }, [isOpen, ip, port]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Opening VNC - {computerName || ip}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Connection Details</h3>
              <p className="text-sm text-muted-foreground">
                <strong>IP:</strong> {ip}<br/>
                <strong>Port:</strong> {port}<br/>
                <strong>Computer:</strong> {computerName || 'Unknown'}<br/>
                <strong>Password:</strong> 123 (auto-filled)<br/>
                <strong>Platform:</strong> {navigator.platform}<br/>
                <strong>Browser:</strong> {navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') ? 'Safari' : 'Other'}<br/>
                <strong>Method:</strong> {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? 'Native VNC App' : 'Web VNC'}
              </p>
            </div>
          </div>
          
          {/* Manual VNC buttons for Mac users */}
          {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && (
            <div className="text-center space-y-2">
              <Button 
                onClick={handleWebVNC}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                🔗 Open Web VNC (Mac)
              </Button>
              <Button 
                onClick={handleVNCApp}
                variant="outline"
                className="w-full"
              >
                🖥️ Open Native VNC App
              </Button>
            </div>
          )}

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              🚀 Fast VNC Connection (Mac Optimized)
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? 'Opening native VNC app...' : 'Opening web VNC...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? 'Using native VNC app' : 'Using web VNC'}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? 'Mac detected, use buttons above' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') < 0 ? 'Windows/Linux detected, using web VNC' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? '💡 Tip: Make sure VNC app is installed' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? '💡 Tip: Click buttons above to avoid popup blocking' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? '🚫 Popup blocking detected on Mac' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? '✅ Solution: Use manual buttons above' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? '🔧 Manual override for Mac users' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? '🎯 Click buttons above to connect' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? '🚀 Ready to connect!' : ''}
            </p>
          </div>

          <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded">
            <p><strong>Note:</strong> Web VNC using Windows proxy server will open in browser. Password: 123 (auto-filled)</p>
            <p><strong>URL:</strong> <a href={`${API_CONFIG.NOVNC_URL}/vnc.html?ip=${ip}&port=${port}&password=123`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{API_CONFIG.NOVNC_URL}/vnc.html?ip={ip}&port={port}&password=123</a></p>
            <p><strong>Mac Users:</strong> Use the buttons above or click the URL to open VNC</p>
            <p><strong>Native VNC:</strong> <a href={`vnc://:123@${ip}:${port}`} className="text-blue-600 hover:underline">vnc://:123@{ip}:{port}</a></p>
            <p><strong>Mac Safari:</strong> Will use native VNC app automatically</p>
            <p><strong>Mac Chrome/Firefox:</strong> Use manual buttons to avoid popup blocking</p>
            <p><strong>Troubleshooting:</strong> If VNC doesn't work, try clicking the URL manually</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
