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
  const [vncAppAvailable, setVncAppAvailable] = useState<boolean | null>(null);

  // Check if VNC app is available when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      checkVNCApp();
    }
  }, [isOpen]);

  const checkVNCApp = () => {
    try {
      // Try to open VNC app
      const vncUrl = `vnc://:123@${ip}:${port}`;
      const vncWindow = window.open(vncUrl, '_blank');
      
      // Check if VNC app opened successfully
      setTimeout(() => {
        if (vncWindow && !vncWindow.closed) {
          setVncAppAvailable(true);
          // Close the test window
          vncWindow.close();
        } else {
          setVncAppAvailable(false);
        }
      }, 1000);
    } catch (error) {
      setVncAppAvailable(false);
    }
  };

  const handleVNCApp = () => {
    // Try to open VNC in native app with password
    const vncUrl = `vnc://:123@${ip}:${port}`;
    window.open(vncUrl, '_blank');
  };

  const handleWebVNC = () => {
    // Open in new window for web VNC (websockify proxy) with password
    const webVncUrl = `http://${ip}:5901?password=123`;
    window.open(webVncUrl, '_blank', 'width=1024,height=768');
  };

  // Auto-open Web VNC when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Auto-open Web VNC instead of checking VNC app
      setTimeout(() => {
        handleWebVNC();
        onClose();
      }, 1000);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Remote Desktop - {computerName || ip}
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

          <div className="space-y-3">
            <h4 className="font-medium">Choose Connection Method:</h4>
            
            {vncAppAvailable === null && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                <p className="text-xs text-muted-foreground mt-1">Checking VNC app availability...</p>
              </div>
            )}
            
            {vncAppAvailable === true && (
              <Button
                onClick={handleVNCApp}
                className="w-full justify-start"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open with VNC App ✅
                <span className="text-xs text-muted-foreground ml-auto">
                  (TightVNC, RealVNC, etc.)
                </span>
              </Button>
            )}
            
            {vncAppAvailable === false && (
              <Button
                onClick={handleVNCApp}
                className="w-full justify-start"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open with VNC App ⚠️
                <span className="text-xs text-muted-foreground ml-auto">
                  (Not detected - may not work)
                </span>
              </Button>
            )}

            <Button
              onClick={handleWebVNC}
              className="w-full justify-start"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Web VNC
              <span className="text-xs text-muted-foreground ml-auto">
                (Browser-based)
              </span>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded">
            <p><strong>Note:</strong> VNC Server and WebSocket proxy are running on {ip}:5900 and {ip}:5901</p>
            <p><strong>Password:</strong> 123 (auto-filled)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
