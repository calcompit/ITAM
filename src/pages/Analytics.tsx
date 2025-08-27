import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ComputerCard } from "@/components/computer-card";
import { ComputerDetailsModal } from "@/components/computer-details-modal";
import { Button } from "@/components/ui/button";
import { Search, Filter, BarChart3, Cpu, HardDrive, MemoryStick, CheckCircle, AlertTriangle, Monitor, X } from "lucide-react";
import { type APIComputer } from "@/services/api";
import { useData } from "@/contexts/DataContext";
import { API_CONFIG } from "@/config/api";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { openVNCPopup, getStoredVNCLinks, removeVNCLink, clearOldVNCLinks, formatTimestamp } from "@/lib/popup-utils";
import { AnalyticsLoadingOverlay } from "@/components/loading-overlay";

interface AnalyticsProps {
  showPinnedOnly?: boolean;
}

export function Analytics({ showPinnedOnly = false }: AnalyticsProps) {
  // Use global data context instead of local state
  const { computers, loading, error } = useData();
  
  const [localComputers, setLocalComputers] = useState<APIComputer[]>([]);
  const [selectedComputer, setSelectedComputer] = useState<APIComputer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpuFilter, setCpuFilter] = useState<string>("all");
  const [ramFilter, setRamFilter] = useState<string>("all");
  const [storageFilter, setStorageFilter] = useState<string>("all");
  const [activatedFilter, setActivatedFilter] = useState<string>("all");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const { toast } = useToast();

  // Load VNC links and clear old ones
  useEffect(() => {
    clearOldVNCLinks();
    const links = getStoredVNCLinks();
    setVncLinks(links);
  }, []);

  // Sync localComputers with global computers data and pinned status
  useEffect(() => {
    if (computers.length > 0) {
      // Load pinned computers from localStorage
      const loadPinnedComputers = (): string[] => {
        try {
          const pinned = localStorage.getItem('pinnedComputers');
          return pinned ? JSON.parse(pinned) : [];
        } catch (error) {
          return [];
        }
      };
      
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
  
  // VNC Connection Modal States
  const [showVncModal, setShowVncModal] = useState(false);
  const [vncModalTitle, setVncModalTitle] = useState("");
  const [vncModalMessage, setVncModalMessage] = useState("");
  const [vncModalType, setVncModalType] = useState<"loading" | "error" | "success">("loading");
  const [vncLinks, setVncLinks] = useState<any[]>([]);



  const handleRemoveVNCLink = (linkId: string) => {
    removeVNCLink(linkId);
    const links = getStoredVNCLinks();
    setVncLinks(links);
  };

  // VNC connection handler
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
      } else if (sessionResponse.status === 409) {
        // User already has an active session for this target
        const result = await sessionResponse.json();
        if (result.existingSession) {
          session = {
            port: result.existingSession.port,
            host: result.existingSession.host,
            targetPort: result.existingSession.targetPort,
            sessionId: result.existingSession.sessionId,
            vncUrl: `${API_CONFIG.NOVNC_URL.replace(':6081', `:${result.existingSession.port}`)}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`
          };
        }
      }

      // Wait for websockify to be ready (simplified approach)
      if (session) {
        console.log('Starting VNC Connection...');
        
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
        
        const vncUrl = session.vncUrl || `${API_CONFIG.NOVNC_URL.replace(':6081', `:${session.port}`)}/vnc.html?autoconnect=true&resize=scale&scale_cursor=true&clip=true&shared=true&repeaterID=&password=123`;
        
        console.log('Opening VNC URL in new window:', vncUrl);
        
        // Use improved popup handling
        const popupResult = openVNCPopup(vncUrl, computerName, ip);
        
        if (popupResult.isBlocked) {
          // Popup blocked - show specific solution
          setVncModalTitle("⚠️ Popup Blocked");
          setVncModalMessage(popupResult.solution);
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
        setVncModalTitle("VNC Error");
        setVncModalMessage("Failed to start VNC session");
        setVncModalType("error");
      }
    } catch (error) {
      console.error('Failed to start VNC session', error);
      setVncModalTitle("VNC Connection Failed");
      setVncModalMessage("Failed to start VNC session. Please try again.");
      setVncModalType("error");
    }
  };

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

  // Load analytics data only once on mount
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analytics = await apiService.getAnalytics();
        setAnalyticsData(analytics);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      }
    };

    loadAnalytics();
  }, []);

  const handlePin = (machineID: string) => {
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

    const computer = localComputers.find(c => c.machineID === machineID);
    const isCurrentlyPinned = computer?.isPinned || false;
    
    // Update computer's pinned status
    const updatedComputers = localComputers.map(computer => {
      if (computer.machineID === machineID) {
        return { ...computer, isPinned: !computer.isPinned };
      }
      return computer;
    });
    
    // Update global computers state through DataContext
    // Note: This will trigger a re-render of the component
    
    // Save to localStorage
    const pinnedMachineIDs = updatedComputers
      .filter(computer => computer.isPinned)
      .map(computer => computer.machineID);
    savePinnedComputers(pinnedMachineIDs);
    
    // Force re-render by updating the component state
    setLocalComputers(updatedComputers);
  };

  // Extract CPU types
  const getCpuType = (cpuModel: string) => {
    const model = cpuModel.toLowerCase();
    if (model.includes('pentium')) return 'pentium';
    if (model.includes('i3')) return 'i3';
    if (model.includes('i5')) return 'i5';
    if (model.includes('i7')) return 'i7';
    if (model.includes('xeon')) return 'xeon';
    return 'other';
  };

  const filteredComputers = useMemo(() => {
    let computersToFilter = localComputers;
    
    // Apply pinned filter first (global filter)
    if (showPinnedOnly) {
      computersToFilter = localComputers.filter(c => c.isPinned);
    }
    
    const filtered = computersToFilter.filter(computer => {
      // Search filter
      const matchesSearch = computer.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        computer.machineID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        computer.ipAddresses.some(ip => ip.includes(searchTerm)) ||
        computer.domain.toLowerCase().includes(searchTerm.toLowerCase());

      // CPU filter
      const matchesCpu = cpuFilter === "all" || getCpuType(computer.cpu.model) === cpuFilter;

      // RAM filter
      const matchesRam = ramFilter === "all" || 
        (ramFilter === "4-8" && computer.ram.totalGB >= 4 && computer.ram.totalGB <= 8) ||
        (ramFilter === "8-16" && computer.ram.totalGB > 8 && computer.ram.totalGB <= 16) ||
        (ramFilter === "16-32" && computer.ram.totalGB > 16 && computer.ram.totalGB <= 32) ||
        (ramFilter === "32+" && computer.ram.totalGB > 32);

      // Storage filter
      const matchesStorage = storageFilter === "all" ||
        (storageFilter === "0-250" && computer.storage.totalGB <= 250) ||
        (storageFilter === "250-500" && computer.storage.totalGB > 250 && computer.storage.totalGB <= 500) ||
        (storageFilter === "500-1000" && computer.storage.totalGB > 500 && computer.storage.totalGB <= 1000) ||
        (storageFilter === "1000+" && computer.storage.totalGB > 1000);

      // Activated filter
      const matchesActivated = activatedFilter === "all" ||
        (activatedFilter === "activated" && computer.winActivated) ||
        (activatedFilter === "not-activated" && !computer.winActivated);

      return matchesSearch && matchesCpu && matchesRam && matchesStorage && matchesActivated;
    });
    
    // Sort by IP address and separate online/offline
    return filtered.sort((a, b) => {
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
  }, [localComputers, searchTerm, cpuFilter, ramFilter, storageFilter, activatedFilter, showPinnedOnly]);



  const clearFilters = () => {
    setSearchTerm("");
    setCpuFilter("all");
    setRamFilter("all");
    setStorageFilter("all");
    setActivatedFilter("all");
  };

  // Show loading overlay
  if (loading) {
    return (
      <>
        <AnalyticsLoadingOverlay isLoading={true} />
        <div className="space-y-6 opacity-50">
          {/* Show skeleton content behind loading overlay */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg border p-6">
                <div className="h-4 bg-muted rounded w-24 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
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
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
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
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Computer hardware and software analysis</p>
        </div>
      </div>

      {/* Analytics Cards with Fast Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border card-fast fast-animation data-item">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CPU Distribution</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData && analyticsData.cpuTypes ? (
                Object.entries(analyticsData.cpuTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center list-item-fast">
                    <span className="text-sm text-foreground capitalize">{type}</span>
                    <Badge variant="secondary" className="fast-animation">{String(count)}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Loading CPU data...</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border card-fast fast-animation data-item">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RAM Distribution</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData && analyticsData.ramDistribution ? (
                Object.entries(analyticsData.ramDistribution).map(([range, count]) => (
                  <div key={range} className="flex justify-between items-center list-item-fast">
                    <span className="text-sm text-foreground">{range}</span>
                    <Badge variant="secondary" className="fast-animation">{count as number}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Loading RAM data...</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border card-fast fast-animation data-item">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Distribution</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData && analyticsData.storageDistribution ? (
                Object.entries(analyticsData.storageDistribution).map(([range, count]) => (
                  <div key={range} className="flex justify-between items-center list-item-fast">
                    <span className="text-sm text-foreground">{range}</span>
                    <Badge variant="secondary" className="fast-animation">{count as number}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Loading Storage data...</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border card-fast fast-animation data-item">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Windows Activation</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center list-item-fast">
                <span className="text-sm text-status-online">Activated</span>
                <Badge variant="secondary" className="fast-animation">{analyticsData?.activatedCount || 0}</Badge>
              </div>
              <div className="flex justify-between items-center list-item-fast">
                <span className="text-sm text-status-offline">Not Activated</span>
                <Badge variant="secondary" className="fast-animation">{analyticsData?.notActivatedCount || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search computers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CPU Type</Label>
              <Select value={cpuFilter} onValueChange={setCpuFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All CPUs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All CPUs</SelectItem>
                  <SelectItem value="pentium">Pentium</SelectItem>
                  <SelectItem value="i3">Intel i3</SelectItem>
                  <SelectItem value="i5">Intel i5</SelectItem>
                  <SelectItem value="i7">Intel i7</SelectItem>
                  <SelectItem value="xeon">Intel Xeon</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>RAM Size</Label>
              <Select value={ramFilter} onValueChange={setRamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All RAM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RAM</SelectItem>
                  <SelectItem value="4-8">4-8 GB</SelectItem>
                  <SelectItem value="8-16">8-16 GB</SelectItem>
                  <SelectItem value="16-32">16-32 GB</SelectItem>
                  <SelectItem value="32+">32+ GB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Storage Size</Label>
              <Select value={storageFilter} onValueChange={setStorageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Storage</SelectItem>
                  <SelectItem value="0-250">0-250 GB</SelectItem>
                  <SelectItem value="250-500">250-500 GB</SelectItem>
                  <SelectItem value="500-1000">500 GB - 1 TB</SelectItem>
                  <SelectItem value="1000+">1 TB+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Windows Activation</Label>
              <Select value={activatedFilter} onValueChange={setActivatedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="activated">Activated</SelectItem>
                  <SelectItem value="not-activated">Not Activated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Filtered Results ({filteredComputers.length} computers)
        </h2>
      </div>

      {/* Computers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredComputers.map((computer, index) => (
          <div 
            key={computer.machineID}
            className="stagger-item"
            style={{ '--stagger-index': index } as React.CSSProperties}
          >
            <ComputerCard
              computer={computer as any}
              onPin={handlePin}
              onClick={(computer) => setSelectedComputer(computer)}
              onVNC={(ip, computerName) => handleVNC(ip, computerName)}
            />
          </div>
        ))}
      </div>

      {filteredComputers.length === 0 && (
        <Card className="bg-gradient-card border-border">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No computers found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Computer Details Modal */}
      <ComputerDetailsModal
        computer={selectedComputer}
        open={!!selectedComputer}
        onClose={() => setSelectedComputer(null)}
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