import React, { useState, useEffect, useMemo } from "react";
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
  Circle,
  X
} from "lucide-react";
import { type APIComputer, type IPGroup } from "@/services/api";
import { useData } from "@/contexts/DataContext";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Search, Filter, AlertTriangle, CheckCircle } from "lucide-react";
import { openVNCPopup, getStoredVNCLinks, removeVNCLink, clearOldVNCLinks, formatTimestamp } from "@/lib/popup-utils";
import { DashboardLoadingOverlay } from "@/components/loading-overlay";


interface DashboardProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  showPinnedOnly?: boolean;
}

export function Dashboard({ activeTab, onTabChange, showPinnedOnly = false, onPinnedCountChange }: DashboardProps & { onPinnedCountChange?: (count: number) => void }) {
  // Use global data context instead of local state
  const { computers, ipGroups, loading, error, isUpdating, updatedMachineIDs, updateTypes, changedFields } = useData();
  
  const [pinnedComputers, setPinnedComputers] = useState<string[]>([]);
  const [localComputers, setLocalComputers] = useState<APIComputer[]>([]);
  const [selectedSubnet, setSelectedSubnet] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComputer, setSelectedComputer] = useState<APIComputer | null>(null);
  const [showComputerDetails, setShowComputerDetails] = useState(false);
  
  // VNC Connection Modal States
  const [showVncModal, setShowVncModal] = useState(false);
  const [vncModalTitle, setVncModalTitle] = useState("");
  const [vncModalMessage, setVncModalMessage] = useState("");
  const [vncModalType, setVncModalType] = useState<"loading" | "error" | "success">("loading");
  const [vncLinks, setVncLinks] = useState<any[]>([]);

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

  // Load VNC links and clear old ones
  useEffect(() => {
    clearOldVNCLinks();
    const links = getStoredVNCLinks();
    setVncLinks(links);
  }, []);



  // Load pinned computers on mount and sync with computers data
  useEffect(() => {
    const pinnedMachineIDs = loadPinnedComputers();
    setPinnedComputers(pinnedMachineIDs);
    
    // Sync pinned status with computers data
    if (computers.length > 0) {
      const updatedComputers = computers.map(computer => ({
        ...computer,
        isPinned: pinnedMachineIDs.includes(computer.machineID)
      }));
      setLocalComputers(updatedComputers);
    }
  }, [computers.length]);

  // Update pinned count when pinned computers change
  useEffect(() => {
    if (onPinnedCountChange) {
      onPinnedCountChange(pinnedComputers.length);
    }
  }, [pinnedComputers, onPinnedCountChange]);

  // Sync pinned status when computers data changes
  useEffect(() => {
    if (computers.length > 0) {
      const pinnedMachineIDs = loadPinnedComputers();
      const updatedComputers = computers.map(computer => ({
        ...computer,
        isPinned: pinnedMachineIDs.includes(computer.machineID)
      }));
      setLocalComputers(updatedComputers);
    } else {
      setLocalComputers([]);
    }
  }, [computers]);



  const handlePin = (machineID: string) => {
    const computer = localComputers.find(c => c.machineID === machineID);
    const isCurrentlyPinned = computer?.isPinned || false;
    
    const updatedComputers = localComputers.map(computer => {
      if (computer.machineID === machineID) {
        return { ...computer, isPinned: !computer.isPinned };
      }
      return computer;
    });
    
    setLocalComputers(updatedComputers);
    
    // Update pinnedComputers state
    const newPinnedMachineIDs = updatedComputers
      .filter(computer => computer.isPinned)
      .map(computer => computer.machineID);
    setPinnedComputers(newPinnedMachineIDs);
    
    // Save to localStorage
    savePinnedComputers(newPinnedMachineIDs);
  };

  const handleComputerClick = (computer: APIComputer) => {
    setSelectedComputer(computer);
    setShowComputerDetails(true);
  };

  const handleRemoveVNCLink = (linkId: string) => {
    removeVNCLink(linkId);
    const links = getStoredVNCLinks();
    setVncLinks(links);
  };

  const handleVNC = async (ip: string, computerName: string) => {
             // Show loading modal immediately when button is clicked
         setVncModalTitle("VNC Connection");
         setVncModalMessage(`Connecting to ${computerName} (${ip})...`);
    setVncModalType("loading");
    setShowVncModal(true);
    
    try {
      console.log(`Starting VNC for IP: ${ip} (${computerName})`);
      
      const currentUser = localStorage.getItem('currentUser') || 'default';
      
      // Close any existing VNC windows and clear references
      if ((window as any).vncWindow && !(window as any).vncWindow.closed) {
        try {
          (window as any).vncWindow.close();
          console.log('Closed existing VNC window');
        } catch (error) {
          console.log('Error closing existing window:', error);
        }
      }
      
      // Clear any existing VNC window references
      (window as any).vncWindow = null;
      
      // Force browser to forget about previous VNC windows
      if ((window as any).vncWindows) {
        (window as any).vncWindows.forEach((win: any) => {
          try {
            if (win && !win.closed) {
              win.close();
            }
          } catch (error) {
            console.log('Error closing VNC window:', error);
          }
        });
      }
      (window as any).vncWindows = [];
      
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
        
        // Use improved popup handling
        console.log(`Opening VNC URL in new window: ${finalVncUrl}`);
        const popupResult = openVNCPopup(finalVncUrl, computerName, ip);
        
        if (popupResult.isBlocked) {
          // Popup blocked - show specific solution with alternatives
          setVncModalTitle("⚠️ Popup Blocked - Security Feature");
          setVncModalMessage(
            `${popupResult.solution}\n\n` +
            `ทางเลือกอื่นๆ:\n` +
            popupResult.alternativeSolutions?.map((alt, index) => `${index + 1}. ${alt}`).join('\n') || ''
          );
          setVncModalType("error");
          
          // Update VNC links
          const links = getStoredVNCLinks();
          setVncLinks(links);
        } else {

          
          // Success - show success modal and auto-close after 2 seconds
          setVncModalTitle("VNC Connected");
          setVncModalMessage(`Successfully connected to ${computerName} (${ip})`);
          setVncModalType("success");
          
          // Auto-close success modal after 2 seconds
          setTimeout(() => {
            setShowVncModal(false);
          }, 2000);
        }
      } else {
        console.error('Failed to start VNC session');
        setVncModalTitle("VNC Error");
        setVncModalMessage("Failed to start VNC session");
        setVncModalType("error");
      }
    } catch (error) {
      console.error('Error starting VNC:', error);
      setVncModalTitle("VNC Error");
      setVncModalMessage("Failed to start VNC connection");
      setVncModalType("error");
    }
  };

  const filteredComputers = localComputers.filter(computer => 
    computer.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    computer.machineID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    computer.ipAddresses.some(ip => ip.includes(searchTerm)) ||
    computer.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalComputers = localComputers.length;
  const onlineComputers = localComputers.filter(c => c.status === "online").length;
  const offlineComputers = localComputers.filter(c => c.status === "offline").length;
  const alertComputers = localComputers.filter(c => c.status === "alert").length;
  const activatedComputers = localComputers.filter(c => c.winActivated).length;
  const notActivatedComputers = localComputers.filter(c => !c.winActivated).length;
  const pinnedComputersList = localComputers.filter(c => c.isPinned);
  
  // Update pinned count when it changes
  useEffect(() => {
    onPinnedCountChange?.(pinnedComputersList.length);
  }, [pinnedComputersList.length, onPinnedCountChange]);
  
  // Calculate stats for selected subnet
  const subnetComputers = selectedSubnet ? localComputers.filter(computer => {
    const primaryIP = computer.ipAddresses[0] || "";
    if (!primaryIP) return false;
    const computerSubnet = primaryIP.substring(0, primaryIP.lastIndexOf('.')) + '.x';
    return computerSubnet === selectedSubnet;
  }) : [];

  // Filter IP groups based on pinned filter
  const filteredIpGroups = useMemo(() => {
    if (showPinnedOnly) {
      // Filter computers by pinned status first
      const pinnedComputers = localComputers.filter(c => c.isPinned);
      
      // Group pinned computers by subnet
      const pinnedGroups = new Map<string, { subnet: string; computers: APIComputer[] }>();
      
      pinnedComputers.forEach(computer => {
        const primaryIP = computer.ipAddresses[0] || "";
        if (primaryIP) {
          const subnet = primaryIP.substring(0, primaryIP.lastIndexOf('.')) + '.x';
          if (!pinnedGroups.has(subnet)) {
            pinnedGroups.set(subnet, { subnet, computers: [] });
          }
          pinnedGroups.get(subnet)!.computers.push(computer);
        }
      });
      
      // Convert to IPGroup format
      return Array.from(pinnedGroups.values()).map(group => ({
        subnet: group.subnet,
        totalComputers: group.computers.length,
        onlineCount: group.computers.filter(c => c.status === "online").length,
        offlineCount: group.computers.filter(c => c.status === "offline").length,
        alertCount: group.computers.filter(c => c.status === "alert").length
      }));
    }
    return ipGroups;
  }, [ipGroups, showPinnedOnly, localComputers]);
  
  const subnetTotal = subnetComputers.length;
  const subnetOnline = subnetComputers.filter(c => c.status === "online").length;
  const subnetOffline = subnetComputers.filter(c => c.status === "offline").length;
  const subnetAlert = subnetComputers.filter(c => c.status === "alert").length;
  const subnetActivated = subnetComputers.filter(c => c.winActivated).length;

  const getDisplayComputers = () => {
    let computersToDisplay = [];
    
    // Apply pinned filter first (global filter)
    if (showPinnedOnly) {
      computersToDisplay = pinnedComputersList;
    } else if (activeTab === "pinned") {
      computersToDisplay = pinnedComputersList;
    } else if (selectedSubnet) {
      computersToDisplay = localComputers.filter(computer => {
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
          {filteredIpGroups.map((group) => (
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

  // Show loading overlay
  if (loading) {
    return (
      <>
        <DashboardLoadingOverlay isLoading={true} />
        <div className="space-y-6">
          {/* Show skeleton content behind loading overlay */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg border p-6 opacity-50">
                <div className="h-4 bg-muted rounded w-24 mb-4"></div>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </>
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
    <div className="space-y-6 page-transition-in">

      {/* Database Status Banner */}
      
      


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
      {(activeTab === "dashboard" || activeTab === "pinned" || selectedSubnet || showPinnedOnly) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {showPinnedOnly ? "Pinned Computers" : activeTab === "pinned" ? "Pinned Computers" : selectedSubnet ? `${selectedSubnet} Computers` : "Total Computers"}
              </CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {showPinnedOnly ? pinnedComputersList.length : activeTab === "pinned" ? pinnedComputersList.length : selectedSubnet ? subnetTotal : totalComputers}
              </div>
              <p className="text-xs text-muted-foreground">
                {showPinnedOnly
                  ? `${pinnedComputersList.filter(c => c.winActivated).length} activated`
                  : activeTab === "pinned"
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
                {showPinnedOnly
                  ? pinnedComputersList.filter(c => c.status === "online").length
                  : activeTab === "pinned" 
                  ? pinnedComputersList.filter(c => c.status === "online").length 
                  : selectedSubnet
                  ? subnetOnline
                  : onlineComputers}
              </div>
              <p className="text-xs text-muted-foreground">
                {showPinnedOnly
                  ? `${((pinnedComputersList.filter(c => c.status === "online").length / Math.max(pinnedComputersList.length, 1)) * 100).toFixed(1)}% online`
                  : activeTab === "pinned"
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
                {showPinnedOnly
                  ? pinnedComputersList.filter(c => c.status === "offline").length
                  : activeTab === "pinned" 
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
                {showPinnedOnly
                  ? pinnedComputersList.filter(c => c.status === "alert").length
                  : activeTab === "pinned" 
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

      {/* VNC Links Container - Show when there are stored links */}
      {vncLinks.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">VNC Connections (Popup Blocked)</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                vncLinks.forEach(link => removeVNCLink(link.id));
                setVncLinks([]);
              }}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
          <p className="text-xs text-blue-600 mb-3">Click the links below to open VNC connections:</p>
          <div className="space-y-2">
            {vncLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {link.computerName} ({link.ip})
                  </a>
                  <p className="text-xs text-gray-500">{formatTimestamp(link.timestamp)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveVNCLink(link.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Computers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {getDisplayComputers().map((computer, index) => (
          <div 
            key={computer.machineID}
            className="stagger-item"
            style={{ '--stagger-index': index } as React.CSSProperties}
          >
            <ComputerCard
              computer={computer}
              onPin={handlePin}
              onClick={handleComputerClick}
              onVNC={handleVNC}
              isUpdated={updatedMachineIDs.has(computer.machineID)}
              updateType={updateTypes.get(computer.machineID)}
              changedFields={changedFields.get(computer.machineID)}
            />
          </div>
        ))}
      </div>



      {/* Computer Details Modal */}
      <ComputerDetailsModal
        computer={selectedComputer}
        open={showComputerDetails}
        onClose={() => {
          setShowComputerDetails(false);
          setSelectedComputer(null);
        }}
        onVNC={handleVNC}
      />

      {/* VNC Connection Modal */}
      <Dialog open={showVncModal} onOpenChange={setShowVncModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{vncModalTitle}</DialogTitle>
            <DialogDescription>
              {vncModalMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
                         {vncModalType === "loading" && (
               <div className="text-center">
                 <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                   <Monitor className="h-4 w-4" />
                   VNC Connection
                 </div>
                 <p className="text-xs text-muted-foreground mt-2">
                   Please wait...
                 </p>
               </div>
             )}
            {vncModalType === "success" && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">VNC window opened successfully!</span>
              </div>
            )}
            {vncModalType === "error" && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Please check browser popup settings</span>
              </div>
            )}
          </div>
          {vncModalType === "error" && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowVncModal(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}