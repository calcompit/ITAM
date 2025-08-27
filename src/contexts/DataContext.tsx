import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, type APIComputer, type IPGroup } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useStatus } from '@/contexts/StatusContext';
import { websocketService } from '@/services/websocket';

interface DataContextType {
  computers: APIComputer[];
  ipGroups: IPGroup[];
  changelogData: Record<string, any[]>; // Add changelog data
  loading: boolean;
  error: string | null;
  refreshData: (showLoading?: boolean) => Promise<void>;
  isUpdating: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [computers, setComputers] = useState<APIComputer[]>([]);
  const [ipGroups, setIpGroups] = useState<IPGroup[]>([]);
  const [changelogData, setChangelogData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { toast } = useToast();
  const { updateStatus, updateLastUpdate } = useStatus();

  // Load pinned computers from localStorage
  const loadPinnedComputers = (): string[] => {
    try {
      const pinned = localStorage.getItem('pinnedComputers');
      return pinned ? JSON.parse(pinned) : [];
    } catch (error) {
      return [];
    }
  };

  // Load changelog for all computers
  const loadAllChangelog = async (computerIds: string[]) => {
    try {
      console.log('[DATA] Loading changelog for all computers...');
      const changelogMap: Record<string, any[]> = {};
      
      // Load changelog sequentially to avoid overwhelming the server
      for (const machineId of computerIds) {
        try {
          const changelog = await apiService.getComputerChangelog(machineId);
          changelogMap[machineId] = changelog || [];
        } catch (error) {
          console.error(`Failed to load changelog for ${machineId}:`, error);
          changelogMap[machineId] = [];
        }
      }

      setChangelogData(changelogMap);
      console.log(`[DATA] Loaded changelog for ${Object.keys(changelogMap).length} computers`);
    } catch (error) {
      console.error('[DATA] Failed to load changelog:', error);
    }
  };

  const refreshData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }
      
      // OPTIMIZED: Load data with timeout and fallback
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const dataPromise = Promise.all([
        apiService.getComputers(),
        apiService.getIPGroups()
      ]);
      
      const [computersData, ipGroupsData] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]);
      
      // Load pinned computers from localStorage
      const pinnedMachineIDs = loadPinnedComputers();
      
      // Set pinned status for computers
      const computersWithPinnedStatus = computersData.map(computer => ({
        ...computer,
        isPinned: pinnedMachineIDs.includes(computer.machineID)
      }));
      
      setComputers(computersWithPinnedStatus);
      setIpGroups(ipGroupsData);
      setError(null);
      updateStatus('connected');
      updateLastUpdate();

      // Load changelog for all computers in background
      const computerIds = computersWithPinnedStatus.map(c => c.machineID);
      loadAllChangelog(computerIds);
    } catch (err) {
      console.error('Failed to load data:', err);
      updateStatus('disconnected');
      
      // Always show error on initial load failure
      if (showLoading) {
        setError('Failed to load data from server');
        toast({
          title: "Database Connection Failed",
          description: "Unable to connect to database. Please refresh the page.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        // Don't update data, keep existing data
        toast({
          title: "Database Connection Lost",
          description: "Showing last known data. Attempting to reconnect...",
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Initial data load - only once
  useEffect(() => {
    if (!isInitialized) {
      refreshData(true);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // WebSocket realtime updates
  useEffect(() => {
    const handleDataUpdate = (data: { type: string; [key: string]: any }) => {
      console.log('[DataContext] Received realtime update:', data);
      
      if (data.type === 'data_update' || data.type === 'computer_update') {
        // Trigger data refresh with fast animation
        setIsUpdating(true);
        refreshData(false).then(() => {
          setIsUpdating(false);
          updateLastUpdate();
        });
      }
    };



    // Listen for WebSocket events
    websocketService.on('data_update', handleDataUpdate);
    websocketService.on('computer_update', handleDataUpdate);

    return () => {
      websocketService.off('data_update', handleDataUpdate);
      websocketService.off('computer_update', handleDataUpdate);
    };
  }, [toast, updateLastUpdate]);

  const value: DataContextType = {
    computers,
    ipGroups,
    changelogData,
    loading,
    error,
    refreshData,
    isUpdating
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
