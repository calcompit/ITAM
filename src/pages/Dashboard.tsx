import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ComputerCard } from "@/components/computer-card";
import { ComputerDetailsModal } from "@/components/computer-details-modal";
import { IPGroupCard } from "@/components/ip-group-card";
import { Analytics } from "@/pages/Analytics";
import { AlertsPage } from "@/pages/AlertsPage";
import { API_CONFIG } from "@/config/api";
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
import { useStatus } from "@/contexts/StatusContext";
import { DatabaseStatusBanner } from "@/components/database-status-banner";

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
  const [selectedComputer, setSelectedComputer] = useState<APIComputer | null>(null);
  const [showComputerDetails, setShowComputerDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedMachineIDs, setUpdatedMachineIDs] = useState<Set<string>>(new Set());

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
          setError(null);
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
        updateStatus('connected');
        updateLastUpdate();
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
        setIsUpdating(true);
        
        // Track which machines were updated for animation
        const updatedIDs = new Set<string>();
        const updatedComputerNames: string[] = [];
        
        setComputers(prevComputers => {
          const updatedComputers = [...prevComputers];
          
          data.data.updatedComputers.forEach((updatedComputer: APIComputer) => {
            const existingIndex = updatedComputers.findIndex(c => c.machineID === updatedComputer.machineID);
            
            if (existingIndex >= 0) {
              // Preserve pinned status
              const wasPinned = updatedComputers[existingIndex].isPinned;
              updatedComputers[existingIndex] = { ...updatedComputer, isPinned: wasPinned };
              updatedIDs.add(updatedComputer.machineID);
              updatedComputerNames.push(updatedComputer.computerName);
            } else {
              // New computer
              updatedComputers.push(updatedComputer);
              updatedIDs.add(updatedComputer.machineID);
              updatedComputerNames.push(updatedComputer.computerName);
            }
          });
          
          return updatedComputers;
        });
        
        // Set animation state
        setUpdatedMachineIDs(updatedIDs);
        
        // Show toast notification
        if (updatedComputerNames.length > 0) {
          const computerList = updatedComputerNames.slice(0, 3).join(', ');
          const moreText = updatedComputerNames.length > 3 ? ` and ${updatedComputerNames.length - 3} more` : '';
          
          toast({
            title: "Data Updated",
            description: `${computerList}${moreText} updated successfully`,
            duration: 3000,
          });
        }
        
        // Clear animation after 2 seconds
        setTimeout(() => {
          setUpdatedMachineIDs(new Set());
          setIsUpdating(false);
        }, 2000);
      }
    };

    websocketService.on('data_change', handleDataChange);
    websocketService.on('data_update', handleDataUpdate);

    // Fallback: Set up polling every 60 seconds if WebSocket fails (without loading)
    const interval = setInterval(() => loadData(false), 60000);

    return () => {
      clearInterval(interval);
      websocketService.off('data_change', handleDataChange);
      websocketService.off('data_update', handleDataUpdate);
      websocketService.disconnect();
    };
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

  const handleComputerClick = (computer: APIComputer) => {
    setSelectedComputer(computer);
    setShowComputerDetails(true);
  };

  const handleVNC = async (ip: string, computerName: string) => {
    try {
      console.log(`Starting VNC for IP: ${ip} (${computerName})`);
      
      const currentUser = localStorage.getItem('currentUser') || 'default';
      
      // Close any existing VNC windows and clear references
      if (window.vncWindow && !window.vncWindow.closed) {
        try {
          window.vncWindow.close();
          console.log('Closed existing VNC window');
        } catch (error) {
          console.log('Error closing existing window:', error);
        }
      }
      
      // Clear any existing VNC window references
      window.vncWindow = null;
      
      // Force browser to forget about previous VNC windows
      if (window.vncWindows) {
        window.vncWindows.forEach((win: any) => {
          try {
            if (win && !win.closed) {
              win.close();
            }
          } catch (error) {
            console.log('Error closing VNC window:', error);
          }
        });
      }
      window.vncWindows = [];
      
      // Start VNC session directly (no login required)
      const sessionResponse = await fetch(`${API_CONFIG.API_BASE_URL}/vnc/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUser, 
          host: ip, 
          port: 5900 
        })
      });

      let session = null;
      if (sessionResponse.ok) {
        const result = await sessionResponse.json();
        session = result.session;
        console.log('New session created:', session);
      } else if (sessionResponse.status === 409) {
        // User already has an active session for this target
        const result = await sessionResponse.json();
        if (result.existingSession) {
          console.log('Existing session found:', result.existingSession);
          session = {
            port: result.existingSession.port,
            host: result.existingSession.host,
            targetPort: result.existingSession.targetPort,
            sessionId: result.existingSession.sessionId,
            vncUrl: `${API_CONFIG.NOVNC_URL.replace(':6081', `:${result.existingSession.port}`)}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`
          };
          console.log('Session with custom VNC URL:', session);
        }
      }

      // Wait for websockify to be ready (simplified approach)
      if (session) {
        console.log('Starting VNC Connection...');
        console.log('Session details:', session);
        toast({
          title: "Starting VNC Connection",
          description: `Connecting to ${computerName} (${ip})...`,
        });
        
        // Fast port checking - optimized for speed
        console.log(`Quick port check for ${session.port}...`);
        
        let attempts = 0;
        const maxAttempts = 6; // Reduced from 10
        let isReady = false;
        
        while (attempts < maxAttempts && !isReady) {
          try {
            // Faster connection check with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 200); // 200ms timeout
            
            const response = await fetch(`http://localhost:${session.port}`, { 
              mode: 'no-cors',
              method: 'HEAD',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            isReady = true;
            console.log(`✅ Port ${session.port} ready!`);
          } catch (error) {
            attempts++;
            console.log(`⏳ Check ${attempts}/${maxAttempts}...`);
            await new Promise(resolve => setTimeout(resolve, 250)); // Reduced to 250ms
          }
        }
        
        if (!isReady) {
          console.log(`⚠️ Quick check completed, proceeding with VNC...`);
          // Reduced fallback wait time
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`Proceeding with VNC connection on port ${session.port}`);
      }
      
      if (session) {
        console.log('VNC session started/retrieved successfully');
        
        // Ensure we use the correct VNC URL with dynamic port
        const finalVncUrl = session.vncUrl || `${API_CONFIG.NOVNC_URL.replace(':6081', `:${session.port}`)}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`;
        console.log('Final VNC URL:', finalVncUrl);
        
        // Open VNC in a new window with specific size - Force new window, not tab
        console.log(`Opening VNC URL in new window: ${finalVncUrl}`);
        
        // Try to open window with different approaches
        let vncWindow = null;
        
        try {
          // Method 1: Force new window with unique name and specific features
          const uniqueWindowName = `vnc_${ip.replace(/\./g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no,directories=no,left=100,top=100';
          
          console.log('Opening VNC with unique window name:', uniqueWindowName);
          vncWindow = window.open(finalVncUrl, uniqueWindowName, windowFeatures);
          console.log('Window open result:', vncWindow);
          
          // Store reference to close later
          window.vncWindow = vncWindow;
          
          // Add to window tracking array
          if (!window.vncWindows) {
            window.vncWindows = [];
          }
          window.vncWindows.push(vncWindow);
          
          if (!vncWindow || vncWindow.closed) {
            // Method 2: Try with different window name to force new window
            const fallbackName = `vnc_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            vncWindow = window.open(finalVncUrl, fallbackName, windowFeatures);
            console.log('Window open with fallback name result:', vncWindow);
            if (vncWindow) {
              window.vncWindow = vncWindow;
              window.vncWindows.push(vncWindow);
            }
          }
          
          if (!vncWindow || vncWindow.closed) {
            // Method 4: Show manual link if all else fails
            console.log('All window.open methods failed, showing manual link');
            toast({
              title: "Popup Blocked",
              description: "Please click the manual link below to open VNC",
              duration: 10000,
            });
            
            // Show manual link container
            const container = document.getElementById('vnc-container');
            if (container) {
              container.classList.remove('hidden');
              
              // Create manual link
              const link = document.createElement('a');
              link.href = finalVncUrl;
              link.target = '_blank';
              link.textContent = `Open VNC Viewer for ${computerName} (${ip})`;
              link.style.display = 'block';
              link.style.marginTop = '10px';
              link.style.padding = '10px';
              link.style.backgroundColor = '#007bff';
              link.style.color = 'white';
              link.style.textDecoration = 'none';
              link.style.borderRadius = '5px';
              link.style.textAlign = 'center';
              
              container.appendChild(link);
            }
            return;
          }
        } catch (error) {
          console.error('Error opening window:', error);
        }
        
        if (!vncWindow || vncWindow.closed) {
          // Popup blocked - show alert
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site to open VNC connections automatically",
            variant: "destructive",
          });
          
          // Show manual link container
          const container = document.getElementById('vnc-container');
          if (container) {
            container.classList.remove('hidden');
            
            // Create manual link
            const link = document.createElement('a');
            link.href = finalVncUrl;
            link.target = '_blank';
            link.textContent = `Open VNC Viewer for ${computerName} (${ip})`;
            link.style.display = 'block';
            link.style.marginTop = '10px';
            link.style.padding = '10px';
            link.style.backgroundColor = '#007bff';
            link.style.color = 'white';
            link.style.textDecoration = 'none';
            link.style.borderRadius = '5px';
            link.style.textAlign = 'center';
            
            container.appendChild(link);
          }
        } else {
          // Send message to enable local scaling after a delay
          setTimeout(() => {
            try {
              vncWindow.postMessage('enableLocalScaling', '*');
            } catch (error) {
              console.error('Error sending postMessage:', error);
            }
          }, 5000);
        }
        
        toast({
          title: "VNC Session Ready",
          description: `Connected to ${computerName} (${ip}) on port ${session.port}`,
        });
      } else {
        console.error('Failed to start VNC session');
        toast({
          title: "VNC Error",
          description: "Failed to start VNC session",
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
          <h3 className="text-lg font-semibold mb-2">Database Connection Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Please check your database connection and try again.
          </p>
          <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Status Banner */}
      <DatabaseStatusBanner />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">{getTitle()}</h1>
          {isUpdating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
              <span>Updating...</span>
            </div>
          )}
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

      {/* VNC Links Container - Hidden by default */}
      <div id="vnc-container" className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg hidden">
        <h3 className="text-sm font-medium text-blue-800 mb-2">VNC Connections</h3>
        <p className="text-xs text-blue-600 mb-2">Click the links below if popup was blocked:</p>
        {/* VNC links will be added here dynamically */}
      </div>

      {/* Computers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {getDisplayComputers().map((computer) => (
          <ComputerCard
            key={computer.machineID}
            computer={computer}
            onPin={handlePin}
            onClick={handleComputerClick}
            onVNC={handleVNC}
            isUpdated={updatedMachineIDs.has(computer.machineID)}
          />
        ))}
      </div>

      {/* Container for manual VNC links */}
      <div id="vnc-container"></div>

      {/* Computer Details Modal */}
      <ComputerDetailsModal
        computer={selectedComputer}
        open={showComputerDetails}
        onClose={() => {
          setShowComputerDetails(false);
          setSelectedComputer(null);
        }}
      />
    </div>
  );
}