import React from 'react';
import { AlertTriangle, Database, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStatus } from '@/contexts/StatusContext';

interface DatabaseStatusBannerProps {
  className?: string;
}

export const DatabaseStatusBanner: React.FC<DatabaseStatusBannerProps> = ({ className = '' }) => {
  const { connectionStatus } = useStatus();

  if (connectionStatus === 'connected') {
    return null; // Don't show banner when connected
  }

  return (
    <Alert className={`mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        {connectionStatus === 'disconnected' ? (
          <>
            <WifiOff className="h-4 w-4 text-status-offline" />
            <div>
              <AlertTitle className="text-destructive font-semibold">Database Connection Lost</AlertTitle>
              <AlertDescription className="text-destructive/90">
                The database connection is currently unavailable. You are viewing the last known data. 
                The system will automatically reconnect when the database is available again.
              </AlertDescription>
            </div>
          </>
        ) : (
          <>
            <Database className="h-4 w-4 text-primary" />
            <div>
              <AlertTitle className="text-primary">Connecting to Database...</AlertTitle>
              <AlertDescription className="text-primary/80">
                Attempting to establish database connection. Please wait...
              </AlertDescription>
            </div>
          </>
        )}
      </div>
    </Alert>
  );
};
