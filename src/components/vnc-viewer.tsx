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
    window.open(vncUrl, '_blank');
  };

  const handleWebVNC = () => {
    // Open in new window for web VNC using HTML page
    const backendIP = '10.51.101.49';
    const webVncUrl = `http://localhost:8080/vnc.html?ip=${backendIP}&port=5901&password=123`;
    window.open(webVncUrl, '_blank', 'width=1024,height=768');
  };

  // Auto-open VNC app when dialog opens (since clients have TightVNC)
  React.useEffect(() => {
    if (isOpen) {
      // Auto-open VNC app since clients have TightVNC installed
      setTimeout(() => {
        handleVNCApp();
        onClose();
      }, 500);
    }
  }, [isOpen]);

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
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              Opening TightVNC application...
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dialog will close automatically...
            </p>
          </div>

          <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded">
            <p><strong>Note:</strong> TightVNC will open automatically. Password: 123 (auto-filled)</p>
            <p><strong>URL:</strong> vnc://:123@{ip}:{port}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
