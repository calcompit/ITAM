import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ComputerCard } from "@/components/computer-card";
import { IPGroupCard } from "@/components/ip-group-card";
import { Analytics } from "@/pages/Analytics";
import { AlertsPage } from "@/pages/AlertsPage";
import { API_CONFIG, buildNovncUrl } from "@/config/api";
import { mockComputers } from "@/data/mock-data";
import { 
  Monitor, 
  Network, 
  Pin, 
  BarChart3, 
  Bell, 
  RefreshCw,
  Circle
} from "lucide-react";
import { apiService, type APIComputer, type IPGroup } from "@/services/api";
import { websocketService } from "@/services/websocket";
import { Input } from "@/components/ui/input";
import { Search, Filter, AlertTriangle, CheckCircle } from "lucide-react";

interface DashboardProps {
  activeTab: string;
}

export function Dashboard({ activeTab }: DashboardProps) {
  const [computers, setComputers] = useState<APIComputer[]>([]);
  const [ipGroups, setIpGroups] = useState<IPGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinnedComputers, setPinnedComputers] = useState<string[]>([]);
  const [selectedSubnet, setSelectedSubnet] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [novncStatus, setNovncStatus] = useState<{ isRunning: boolean } | null>(null);
  const { toast } = useToast();
  
  // Load pinned computers from localStorage
  const loadPinnedComputers = (): string[] => {
    try {
      const pinned = localStorage.getItem('pinnedComputers');
      return pinned ? JSON.parse(pinned) : [];
    } catch (error) {
      return [];
    }
  };

  // Save pinned computers to localStorage
  const savePinnedComputers = (pinnedMachineIDs: string[]) => {
    try {
      localStorage.setItem('pinnedComputers', JSON.stringify(pinnedMachineIDs));
    } catch (error) {
      // Ignore localStorage errors
    }
  };

  // Load data from API
  useEffect(() => {
    const loadData = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const [computersData, ipGroupsData] = await Promise.all([
          apiService.getComputers(),
          apiService.getIPGroups()
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
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data from server');
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };

    // Initial load with loading indicator
    loadData(true);

    // Connect to WebSocket for realtime updates
    websocketService.connect();
    
    // Listen for data changes (legacy - not used anymore)
    const handleDataChange = (data: any) => {
      // This is handled by handleDataUpdate now
    };

    // Listen for data updates (smooth updates without refresh)
    const handleDataUpdate = (data: any) => {
      if (data.data?.updatedComputers) {
        setComputers(prevComputers => {
          const updatedComputers = [...prevComputers];
          
          data.data.updatedComputers.forEach((updatedComputer: APIComputer) => {
            const existingIndex = updatedComputers.findIndex(c => c.machineID === updatedComputer.machineID);
            
            if (existingIndex >= 0) {
              // Preserve pinned status
              const wasPinned = updatedComputers[existingIndex].isPinned;
              updatedComputers[existingIndex] = { ...updatedComputer, isPinned: wasPinned };
            } else {
              // New computer
              updatedComputers.push(updatedComputer);
            }
          });
          
          return updatedComputers;
        });
      }
    };

    websocketService.on('data_change', handleDataChange);
    websocketService.on('data_update', handleDataUpdate);

    // Fallback: Set up polling every 30 seconds if WebSocket fails (without loading)
    const interval = setInterval(() => loadData(false), 30000);

    return () => {
      clearInterval(interval);
      websocketService.off('data_change', handleDataChange);
      websocketService.off('data_update', handleDataUpdate);
      websocketService.disconnect();
    };
  }, []);

  // Check noVNC status
  const checkNovncStatus = async () => {
    try {
      const response = await fetch(API_CONFIG.VNC_STATUS);
      const data = await response.json();
      setNovncStatus(data);
    } catch (error) {
      console.error('Failed to check noVNC status:', error);
      setNovncStatus({ isRunning: false });
    }
  };

  // Check noVNC status on component mount
  useEffect(() => {
    checkNovncStatus();
  }, []);

  const handlePin = (machineID: string) => {
    const updatedComputers = computers.map(computer => {
      if (computer.machineID === machineID) {
        return { ...computer, isPinned: !computer.isPinned };
      }
      return computer;
    });
    
    setComputers(updatedComputers);
    
    // Save to localStorage
    const pinnedMachineIDs = updatedComputers
      .filter(computer => computer.isPinned)
      .map(computer => computer.machineID);
    savePinnedComputers(pinnedMachineIDs);
  };

  const handleVNC = async (ip: string, computerName: string) => {
    try {
      console.log(`Starting VNC for IP: ${ip} (${computerName})`);
      
      // Use the new VNC connect API
      const response = await fetch(API_CONFIG.VNC_CONNECT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: ip,
          port: 5900,
          password: '123'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('VNC connection initiated successfully');
        
        // Open VNC in a new window with specific size
        const vncUrl = data.url;
        const windowFeatures = 'width=1200,height=800,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no';
        
        console.log(`Opening VNC URL in new window: ${vncUrl}`);
        const vncWindow = window.open(vncUrl, 'vnc_window', windowFeatures);
        
        if (vncWindow) {
          // Focus the new window
          vncWindow.focus();
        } else {
          // Fallback to tab if popup is blocked
          window.open(vncUrl, '_blank');
        }
        
        toast({
          title: "VNC Started",
          description: `Connecting to ${computerName} (${ip})...`,
        });
      } else {
        console.error('Failed to start VNC:', data.message);
        toast({
          title: "VNC Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting VNC:', error);
      toast({
        title: "VNC Error",
        description: "Failed to start VNC connection",
        variant: "destructive",
      });
    }
  };

  const filteredComputers = computers.filter(computer => 
    computer.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    computer.machineID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    computer.ipAddresses.some(ip => ip.includes(searchTerm)) ||
    computer.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalComputers = computers.length;
  const onlineComputers = computers.filter(c => c.status === "online").length;
  const offlineComputers = computers.filter(c => c.status === "offline").length;
  const alertComputers = computers.filter(c => c.status === "alert").length;
  const activatedComputers = computers.filter(c => c.winActivated).length;
  const notActivatedComputers = computers.filter(c => !c.winActivated).length;
  const pinnedComputersList = computers.filter(c => c.isPinned);
  
  // Calculate stats for selected subnet
  const subnetComputers = selectedSubnet ? computers.filter(computer => {
    const primaryIP = computer.ipAddresses[0] || "";
    if (!primaryIP) return false;
    const computerSubnet = primaryIP.substring(0, primaryIP.lastIndexOf('.')) + '.x';
    return computerSubnet === selectedSubnet;
  }) : [];
  
  const subnetTotal = subnetComputers.length;
  const subnetOnline = subnetComputers.filter(c => c.status === "online").length;
  const subnetOffline = subnetComputers.filter(c => c.status === "offline").length;
  const subnetAlert = subnetComputers.filter(c => c.status === "alert").length;
  const subnetActivated = subnetComputers.filter(c => c.winActivated).length;

  const getDisplayComputers = () => {
    let computersToDisplay = [];
    
    if (activeTab === "pinned") {
      computersToDisplay = pinnedComputersList;
    } else if (selectedSubnet) {
      computersToDisplay = computers.filter(computer => {
        const primaryIP = computer.ipAddresses[0] || "";
        if (!primaryIP) return false;
        const computerSubnet = primaryIP.substring(0, primaryIP.lastIndexOf('.')) + '.x';
        return computerSubnet === selectedSubnet;
      });
    } else {
      computersToDisplay = filteredComputers;
    }
    
    // Sort by IP address and separate online/offline
    return computersToDisplay.sort((a, b) => {
      const ipA = a.ipAddresses[0] || "";
      const ipB = b.ipAddresses[0] || "";
      
      // First sort by status (online first, then offline)
      if (a.status !== b.status) {
        return a.status === 'online' ? -1 : 1;
      }
      
      // Then sort by IP address (numeric comparison)
      if (ipA && ipB) {
        const ipPartsA = ipA.split('.').map(part => parseInt(part, 10));
        const ipPartsB = ipB.split('.').map(part => parseInt(part, 10));
        
        for (let i = 0; i < 4; i++) {
          if (ipPartsA[i] !== ipPartsB[i]) {
            return ipPartsA[i] - ipPartsB[i];
          }
        }
      }
      
      // If IPs are equal or both empty, sort by computer name
      return (a.computerName || "").localeCompare(b.computerName || "");
    });
  };

  const getTitle = () => {
    if (activeTab === "pinned") return "Pinned Computers";
    if (activeTab === "groups") return "IP Groups";
    if (activeTab === "analytics") return "Analytics";
    if (activeTab === "alerts") return "Alerts";
    if (selectedSubnet) return `Computers in ${selectedSubnet}`;
    return "Computer Overview";
  };

  // Show Analytics page
  if (activeTab === "analytics") {
    return <Analytics />;
  }

  // Show Alerts page
  if (activeTab === "alerts") {
    return <AlertsPage />;
  }

  if (activeTab === "groups" && !selectedSubnet) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">IP Groups</h1>
          <Button 
            variant="outline" 
            onClick={() => setSelectedSubnet(null)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            All Groups
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ipGroups.map((group) => (
            <IPGroupCard
              key={group.subnet}
              group={group}
              onClick={setSelectedSubnet}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getTitle()}</h1>
          {selectedSubnet && (
            <Button
              variant="link"
              onClick={() => setSelectedSubnet(null)}
              className="p-0 h-auto text-primary"
            >
              ← Back to Groups
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* noVNC Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${novncStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              noVNC: {novncStatus?.isRunning ? 'Running' : 'Stopped'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkNovncStatus}
              className="h-6 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search computers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {(activeTab === "dashboard" || activeTab === "pinned" || selectedSubnet) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {activeTab === "pinned" ? "Pinned Computers" : selectedSubnet ? `${selectedSubnet} Computers` : "Total Computers"}
              </CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {activeTab === "pinned" ? pinnedComputersList.length : selectedSubnet ? subnetTotal : totalComputers}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeTab === "pinned"
                  ? `${pinnedComputersList.filter(c => c.winActivated).length} activated`
                  : selectedSubnet
                  ? `${subnetActivated} activated`
                  : `${activatedComputers} activated`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Online
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-status-online" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-online">
                {activeTab === "pinned" 
                  ? pinnedComputersList.filter(c => c.status === "online").length 
                  : selectedSubnet
                  ? subnetOnline
                  : onlineComputers}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeTab === "pinned"
                  ? `${((pinnedComputersList.filter(c => c.status === "online").length / Math.max(pinnedComputersList.length, 1)) * 100).toFixed(1)}% online`
                  : selectedSubnet
                  ? `${((subnetOnline / Math.max(subnetTotal, 1)) * 100).toFixed(1)}% online`
                  : `${((onlineComputers / totalComputers) * 100).toFixed(1)}% uptime`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offline
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-status-offline" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-offline">
                {activeTab === "pinned" 
                  ? pinnedComputersList.filter(c => c.status === "offline").length 
                  : selectedSubnet
                  ? subnetOffline
                  : offlineComputers}
              </div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alert
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-status-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-warning">
                {activeTab === "pinned" 
                  ? pinnedComputersList.filter(c => c.status === "alert").length 
                  : selectedSubnet
                  ? subnetAlert
                  : alertComputers}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires monitoring
              </p>
            </CardContent>
          </Card>


        </div>
      )}

      {/* Computers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getDisplayComputers().map((computer) => (
          <ComputerCard
            key={computer.machineID}
            computer={computer}
            onPin={handlePin}
            onClick={(computer) => {}}
            onVNC={handleVNC}
          />
        ))}
      </div>
    </div>
  );
}