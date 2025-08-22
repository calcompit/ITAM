import React, { createContext, useContext, useState, useEffect } from 'react';

interface StatusContextType {
  lastUpdate: Date;
  connectionStatus: 'connected' | 'disconnected' | 'fallback';
  updateStatus: (status: 'connected' | 'disconnected' | 'fallback') => void;
  updateLastUpdate: () => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};

interface StatusProviderProps {
  children: React.ReactNode;
}

export const StatusProvider: React.FC<StatusProviderProps> = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'fallback'>('connected');

  const updateStatus = (status: 'connected' | 'disconnected' | 'fallback') => {
    setConnectionStatus(status);
    if (status === 'connected') {
      setLastUpdate(new Date());
    }
  };

  const updateLastUpdate = () => {
    setLastUpdate(new Date());
  };

  // Auto-update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        setLastUpdate(new Date());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  return (
    <StatusContext.Provider value={{
      lastUpdate,
      connectionStatus,
      updateStatus,
      updateLastUpdate
    }}>
      {children}
    </StatusContext.Provider>
  );
};
