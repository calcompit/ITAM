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
  const [connectionMethod, setConnectionMethod] = useState<'app' | 'web' | 'detecting'>('detecting');
  const [showFallback, setShowFallback] = useState(false);

  // Auto-detect and open VNC when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setConnectionMethod('detecting');
      setShowFallback(false);
      
      // Try to open VNC app first
      const vncUrl = `vnc://:123@${ip}:${port}`;
      const vncWindow = window.open(vncUrl, '_blank');
      
      // Check if VNC app opened successfully
      setTimeout(() => {
        if (vncWindow && !vncWindow.closed) {
          // VNC app opened successfully
          setConnectionMethod('app');
          setTimeout(() => onClose(), 2000);
        } else {
          // VNC app not available, show fallback options
          setConnectionMethod('web');
          setShowFallback(true);
        }
      }, 1500);
    }
  }, [isOpen, ip, port, onClose]);

  const handleVNCApp = () => {
    const vncUrl = `vnc://:123@${ip}:${port}`;
    window.open(vncUrl, '_blank');
    setConnectionMethod('app');
    setTimeout(() => onClose(), 2000);
  };

  const handleWebVNC = () => {
    const webVncUrl = `http://${ip}:5901?password=123`;
    window.open(webVncUrl, '_blank', 'width=1024,height=768');
    setConnectionMethod('web');
    setTimeout(() => onClose(), 2000);
  };

  const handleManualClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleManualClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              {connectionMethod === 'detecting' && 'Detecting VNC...'}
              {connectionMethod === 'app' && 'VNC App Connected'}
              {connectionMethod === 'web' && 'VNC Connection Options'}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualClose}
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

          {connectionMethod === 'detecting' && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Detecting VNC application...
              </div>
            </div>
          )}

          {connectionMethod === 'app' && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                VNC application opened successfully!
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Dialog will close automatically...
              </p>
            </div>
          )}

          {showFallback && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                  <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                  VNC app not detected
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Please choose an alternative method:
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleVNCApp}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Try VNC App Again
                  <span className="text-xs text-muted-foreground ml-auto">
                    (TightVNC, RealVNC, etc.)
                  </span>
                </Button>

                <Button
                  onClick={handleWebVNC}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Use Web VNC
                  <span className="text-xs text-muted-foreground ml-auto">
                    (Browser-based)
                  </span>
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded">
            {connectionMethod === 'detecting' && (
              <p><strong>Note:</strong> Trying to open VNC application automatically...</p>
            )}
            {connectionMethod === 'app' && (
              <p><strong>Note:</strong> VNC app opened successfully. You can open multiple machines simultaneously.</p>
            )}
            {showFallback && (
              <p><strong>Note:</strong> VNC app not found. Please install TightVNC Viewer or use Web VNC.</p>
            )}
            <p><strong>URL:</strong> vnc://:123@{ip}:{port}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
