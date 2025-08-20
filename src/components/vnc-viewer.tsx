import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink } from 'lucide-react';

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
    window.open(vncUrl, '_blank');
  };

  const handleWebVNC = () => {
    // Open in new window for web VNC using the Windows proxy server
    const webVncUrl = `http://10.51.101.49:8081/vnc.html?ip=${ip}&port=${port}&password=123`;
    window.open(webVncUrl, '_blank', 'width=1024,height=768');
  };

  // Auto-open Web VNC when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Auto-open Web VNC using the Windows proxy server
      setTimeout(() => {
        handleWebVNC();
        onClose();
      }, 1000);
    }
  }, [isOpen]);

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
                <strong>Password:</strong> 123 (auto-filled)
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Opening Web VNC (Windows Proxy Server)...
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dialog will close automatically...
            </p>
          </div>

          <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded">
            <p><strong>Note:</strong> Web VNC using Windows proxy server will open in browser. Password: 123 (auto-filled)</p>
            <p><strong>URL:</strong> http://10.51.101.49:8081/vnc.html?ip={ip}&port={port}&password=123</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
