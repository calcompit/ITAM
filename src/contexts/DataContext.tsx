import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
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
  updatedMachineIDs: Set<string>;
  updateTypes: Map<string, 'status' | 'hud' | 'general' | 'new'>;
  lastUpdateTime: Map<string, number>;
  changedFields: Map<string, string[]>;
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
  const [updatedMachineIDs, setUpdatedMachineIDs] = useState<Set<string>>(new Set());
  const [updateTypes, setUpdateTypes] = useState<Map<string, 'status' | 'hud' | 'general' | 'new'>>(new Map());
  const [lastUpdateTime, setLastUpdateTime] = useState<Map<string, number>>(new Map());
  const [changedFields, setChangedFields] = useState<Map<string, string[]>>(new Map());

  const { toast } = useToast();
  const { updateStatus, updateLastUpdate } = useStatus();

  // Memoized computer data for comparison
  const memoizedComputers = useMemo(() => {
    return computers.map(computer => ({
      machineID: computer.machineID,
      status: computer.status,
      hudVersion: computer.hudVersion,
      ipAddresses: computer.ipAddresses,
      domain: computer.domain,
      sUser: computer.sUser,
      winActivated: computer.winActivated,
      cpu: computer.cpu,
      ram: computer.ram,
      storage: computer.storage,
      updatedAt: computer.updatedAt
    }));
  }, [computers]);

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
        // Show animation for updated computers
        if (data.data?.updatedComputers) {
          const newUpdatedIDs = new Set<string>();
          const newUpdateTypes = new Map<string, 'status' | 'hud' | 'general' | 'new'>();
          const newChangedFields = new Map<string, string[]>();
          
          data.data.updatedComputers.forEach((computer: any) => {
            const now = Date.now();
            const lastUpdate = lastUpdateTime.get(computer.machineID) || 0;
            const timeSinceLastUpdate = now - lastUpdate;
            
            // Debounce: Only show animation if it's been at least 2 seconds since last update
            if (timeSinceLastUpdate < 2000) {
              return;
            }
            
            // Find existing computer from memoized data
            const existingComputer = memoizedComputers.find(c => c.machineID === computer.machineID);
            
            if (!existingComputer) {
              // New computer - show animation
              newUpdatedIDs.add(computer.machineID);
              newUpdateTypes.set(computer.machineID, 'new');
              return;
            }
            
            // Compare data using memoized values
            const changedFields: string[] = [];
            let updateType: 'status' | 'hud' | 'general' | 'new' = 'general';
            
            // Check each field for changes
            if (existingComputer.status !== computer.status) {
              changedFields.push('status');
            }
            if (existingComputer.hudVersion !== computer.hudVersion) {
              changedFields.push('hudVersion');
              updateType = 'hud';
            }
            if (existingComputer.ipAddresses[0] !== computer.ipAddresses[0]) {
              changedFields.push('ipAddress');
            }
            if (existingComputer.domain !== computer.domain) {
              changedFields.push('domain');
            }
            if (existingComputer.sUser !== computer.sUser) {
              changedFields.push('user');
            }
            if (existingComputer.winActivated !== computer.winActivated) {
              changedFields.push('windows');
            }
            if (existingComputer.cpu?.model !== computer.cpu?.model) {
              changedFields.push('cpu');
            }
            if (existingComputer.ram?.totalGB !== computer.ram?.totalGB) {
              changedFields.push('ram');
            }
            if (existingComputer.storage?.totalGB !== computer.storage?.totalGB) {
              changedFields.push('storage');
            }
            
            // Only show animation if there are actual changes
            if (changedFields.length === 0) {
              return;
            }
            
            newUpdatedIDs.add(computer.machineID);
            newUpdateTypes.set(computer.machineID, updateType);
            newChangedFields.set(computer.machineID, changedFields);
            lastUpdateTime.set(computer.machineID, now);
          });
          
          console.log('[Animation Debug] Updated computers:', Array.from(newUpdatedIDs));
          console.log('[Animation Debug] Update types:', Object.fromEntries(newUpdateTypes));
          console.log('[Animation Debug] Changed fields:', Object.fromEntries(newChangedFields));
          
          setUpdatedMachineIDs(newUpdatedIDs);
          setUpdateTypes(newUpdateTypes);
          setChangedFields(newChangedFields);
          
          // Clear animation after 3 seconds
          setTimeout(() => {
            setUpdatedMachineIDs(new Set());
            setUpdateTypes(new Map());
            setChangedFields(new Map());
          }, 3000);
        }
        
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
  }, [toast, updateLastUpdate, memoizedComputers, lastUpdateTime]);

  const value: DataContextType = {
    computers,
    ipGroups,
    changelogData,
    loading,
    error,
    refreshData,
    isUpdating,
    updatedMachineIDs,
    updateTypes,
    lastUpdateTime,
    changedFields
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
