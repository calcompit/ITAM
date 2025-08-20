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
  // Auto-open Web VNC when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Open Web VNC directly
      const webVncUrl = `http://${ip}:5901?password=123`;
      window.open(webVncUrl, '_blank', 'width=1024,height=768');
      
      // Close dialog after opening
      setTimeout(() => onClose(), 2000);
    }
  }, [isOpen, ip, port, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Opening Web VNC - {computerName || ip}
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
              Opening Web VNC in browser...
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dialog will close automatically...
            </p>
          </div>

          <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded">
            <p><strong>Note:</strong> Web VNC will open in browser. You can open multiple machines simultaneously.</p>
            <p><strong>URL:</strong> http://{ip}:5901?password=123</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
