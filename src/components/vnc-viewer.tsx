import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Maximize2, Minimize2, RotateCcw, Settings } from 'lucide-react';

interface VNCViewerProps {
  isOpen: boolean;
  onClose: () => void;
  ip: string;
  port?: number;
  computerName?: string;
}

export function VNCViewer({ isOpen, onClose, ip, port = 5900, computerName }: VNCViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rfbRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const connectVNC = async () => {
      try {
        // Dynamic import to reduce initial bundle size
        const { RFB } = await import('@novnc/novnc/core/rfb');
        
        const wsUrl = `ws://${ip}:${port}`;
        console.log('Connecting to VNC:', wsUrl);
        
        rfbRef.current = new RFB(canvasRef.current!, wsUrl, {
          credentials: { password: '' },
          repeaterID: '',
          wsProtocols: ['binary'],
          clipViewport: false,
          scaleViewport: false,
          resizeSession: true,
          qualityLevel: 6,
          compressionLevel: 2,
        });

        rfbRef.current.addEventListener('connect', () => {
          console.log('VNC Connected!');
          setIsConnected(true);
          setError(null);
        });

        rfbRef.current.addEventListener('disconnect', () => {
          console.log('VNC Disconnected');
          setIsConnected(false);
        });

        rfbRef.current.addEventListener('error', (err: any) => {
          console.error('VNC Error:', err);
          setError('Failed to connect to VNC server');
          setIsConnected(false);
        });

        rfbRef.current.addEventListener('clipboard', (event: any) => {
          console.log('Clipboard:', event.detail.text);
        });

      } catch (err) {
        console.error('Failed to load VNC:', err);
        setError('Failed to load VNC viewer');
      }
    };

    connectVNC();

    return () => {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  }, [isOpen, ip, port]);

  const handleFullscreen = () => {
    if (!canvasRef.current) return;
    
    if (!isFullscreen) {
      canvasRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleReconnect = () => {
    if (rfbRef.current) {
      rfbRef.current.disconnect();
      setTimeout(() => {
        rfbRef.current?.connect();
      }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              VNC Viewer - {computerName || ip}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect}
                    title="Reconnect"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="relative bg-black rounded-b-lg overflow-hidden">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center text-white">
                <p className="text-lg font-semibold mb-2">Connection Failed</p>
                <p className="text-sm text-gray-300 mb-4">{error}</p>
                <Button onClick={handleReconnect} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {!isConnected && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting to {ip}:{port}...</p>
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        
        {isConnected && (
          <div className="p-4 pt-2 text-xs text-muted-foreground">
            <p>Connected to {ip}:{port}</p>
            <p>Use mouse and keyboard to control the remote computer</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
