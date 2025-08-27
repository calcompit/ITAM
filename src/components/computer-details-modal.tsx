import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, HardDrive, MemoryStick, Wifi, Calendar, MonitorCheck } from "lucide-react";
import { MachineIdDisplay } from "@/components/ui/machine-id-display";
import { ClickableText } from "@/components/ui/clickable-text";
import { formatThailandTime } from "@/lib/utils";
import { openVNCPopup, getStoredVNCLinks } from "@/lib/popup-utils";
import { toast } from "@/hooks/use-toast";

import { APIComputer } from "@/services/api";
import { useData } from "@/contexts/DataContext";
import { ComputerDetailsLoadingOverlay } from "@/components/loading-overlay";

interface ComputerDetailsModalProps {
  computer: APIComputer | null;
  open: boolean;
  onClose: () => void;
  onVNC?: (ip: string, computerName: string) => void;
}

export function ComputerDetailsModal({ computer, open, onClose, onVNC }: ComputerDetailsModalProps) {
  // Use global changelog data instead of loading individually
  const { changelogData } = useData();
  const [loadingChangelog, setLoadingChangelog] = useState(false);
  
  // VNC Modal states
  const [showVncModal, setShowVncModal] = useState(false);
  const [vncModalTitle, setVncModalTitle] = useState("");
  const [vncModalMessage, setVncModalMessage] = useState("");
  const [vncModalType, setVncModalType] = useState<"loading" | "success" | "error">("loading");
  const [vncLinks, setVncLinks] = useState<any[]>([]);

  // Get changelog from global data
  const changelog = computer ? (changelogData[computer.machineID] || []) : [];

  // Show loading if changelog is not yet loaded
  useEffect(() => {
    if (computer && open && !changelogData[computer.machineID]) {
      setLoadingChangelog(true);
      // Changelog will be loaded by global context
      setTimeout(() => setLoadingChangelog(false), 1000);
    } else {
      setLoadingChangelog(false);
    }
  }, [computer, open, changelogData]);

  if (!computer) return null;

  // Add error handling for missing data
  const safeRam = computer.ram || { totalGB: 0, modules: [] };
  const safeStorage = computer.storage || { totalGB: 0, devices: [] };
  const safeCpu = computer.cpu || { model: 'N/A', physicalCores: 0, logicalCores: 0 };
  const safeGpu = computer.gpu || [];
  const safeOs = computer.os || { caption: 'N/A', version: 'N/A' };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case "ram": return <MemoryStick className="h-4 w-4" />;
      case "storage": return <HardDrive className="h-4 w-4" />;
      case "name": return <Monitor className="h-4 w-4" />;
      case "ip": return <Wifi className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getHistoryColor = (type: string) => {
    switch (type) {
      case "ram": return "bg-blue-500/20 text-blue-300";
      case "storage": return "bg-green-500/20 text-green-300";
      case "name": return "bg-purple-500/20 text-purple-300";
      case "ip": return "bg-orange-500/20 text-orange-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const handleVNC = async (ip: string) => {
    // If onVNC prop is provided, use it (for Dashboard integration)
    if (onVNC) {
      onVNC(ip, computer.computerName);
      return;
    }
    
    // Show loading modal immediately when button is clicked
    setVncModalTitle("VNC Connection");
    setVncModalMessage(`Connecting to ${computer.computerName} (${ip})...`);
    setVncModalType("loading");
    setShowVncModal(true);
    
    try {
      console.log(`Starting VNC for IP: ${ip} (${computer.computerName})`);
      
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
        const popupResult = openVNCPopup(finalVncUrl, computer.computerName, ip);
        
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
          setVncModalMessage(`Successfully connected to ${computer.computerName} (${ip})`);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto modal-fast-in">
        {loadingChangelog && (
          <ComputerDetailsLoadingOverlay isLoading={true} />
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <ClickableText 
              text={computer.computerName} 
              title="Click to copy Computer Name"
              className="text-lg font-semibold"
            />
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-muted-foreground">Machine ID</span>
                    <MachineIdDisplay machineId={computer.machineID} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Primary IP Address</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{computer.ipAddresses[0] || "N/A"}</span>
                      {computer.ipAddresses[0] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVNC(computer.ipAddresses[0])}
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20 btn-fast-enhanced hover:scale-110"
                          title="VNC Connection"
                        >
                          <MonitorCheck className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {computer.ipAddresses.length > 1 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-sm">All IP Addresses:</span>
                      {computer.ipAddresses.map((ip, index) => (
                        <div key={index} className="flex items-center justify-between font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                          <span>{ip}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVNC(ip)}
                            className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20 btn-fast-enhanced hover:scale-110"
                            title="VNC Connection"
                          >
                            <MonitorCheck className="h-3 w-3 text-blue-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operating System</span>
                    <span>{safeOs.caption}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OS Version</span>
                    <span className="font-mono">{safeOs.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain</span>
                    <span>{computer.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current User</span>
                    <span>{computer.sUser}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Windows Status</span>
                    <span className={`font-medium ${computer.winActivated ? 'text-status-online' : 'text-status-warning'}`}>
                      {computer.winActivated ? 'Activated' : 'Not Activated'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Boot</span>
                    <span>{formatThailandTime(computer.lastBoot)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{formatThailandTime(computer.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusIndicator status={computer.status} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Hardware Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <MemoryStick className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total RAM:</span>
                      <span className="font-semibold">
                        {safeRam.totalGB ? `${safeRam.totalGB}GB` : 'N/A'}
                      </span>
                    </div>
                    <div className="ml-7 space-y-1">
                      {safeRam.modules && safeRam.modules.length > 0 ? (
                        safeRam.modules.map((module, index) => (
                          <div key={index} className="text-xs bg-muted/50 px-2 py-1 rounded">
                            Module {index + 1}: {module.sizeGB}GB (S/N: {module.sn})
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No RAM modules data available</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total Storage:</span>
                      <span className="font-semibold">
                        {safeStorage.totalGB ? `${safeStorage.totalGB}GB` : 'N/A'}
                      </span>
                    </div>
                    <div className="ml-7 space-y-1">
                      {safeStorage.devices && safeStorage.devices.length > 0 ? (
                        safeStorage.devices.map((device, index) => (
                          <div key={index} className="text-xs bg-muted/50 px-2 py-1 rounded space-y-1">
                            <div>{device.model} - {device.sizeGB}GB</div>
                            <div className="text-muted-foreground">S/N: {device.sn}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No storage devices data available</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-muted-foreground">CPU:</div>
                    <div className="ml-3 text-sm">{safeCpu.model}</div>
                    <div className="ml-3 text-xs text-muted-foreground">
                      {safeCpu.physicalCores} Physical Cores, {safeCpu.logicalCores} Logical Cores
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-muted-foreground">Graphics:</div>
                    {safeGpu.length > 0 ? (
                      safeGpu.map((gpu, index) => (
                        <div key={index} className="ml-3 text-sm">{gpu.name}</div>
                      ))
                    ) : (
                      <div className="ml-3 text-sm text-muted-foreground">No GPU data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Change History</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingChangelog ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading history...</span>
                  </div>
                ) : changelog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No change history available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {changelog.map((change, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={change.eventType?.includes('UPDATE') ? 'default' : 
                                   change.eventType?.includes('INSERT') ? 'secondary' : 
                                   change.eventType?.includes('DELETE') ? 'destructive' : 'outline'} 
                            className="capitalize"
                          >
                            {change.eventType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatThailandTime(change.changeDate)}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">ผู้เปลี่ยนแปลง:</span>{" "}
                          <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{change.changedSUser}</span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">ฟิลด์ที่เปลี่ยนแปลง:</span>{" "}
                          <span className="font-semibold text-primary">{change.changedFields}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {Array.isArray(change.changedDetails) ? (
                            change.changedDetails.map((detail, detailIndex) => (
                              <div key={detailIndex} className="bg-background/50 p-3 rounded border-l-3 border-primary/30">
                                <div className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wide">
                                  {detail.field}
                                </div>
                                <div className="text-sm space-y-2">
                                  {change.eventType === 'INSERT' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground text-xs font-medium min-w-[40px]">ค่า:</span>
                                      <span className="text-status-online bg-status-online/10 px-2 py-1 rounded text-xs font-medium">
                                        {detail.new || 'ไม่มีค่า'}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs font-medium min-w-[40px]">จาก:</span>
                                        <span className="text-destructive line-through bg-destructive/10 px-2 py-1 rounded text-xs">
                                          {detail.old || 'ไม่มีค่า'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs font-medium min-w-[40px]">เป็น:</span>
                                        <span className="text-status-online bg-status-online/10 px-2 py-1 rounded text-xs font-medium">
                                          {detail.new || 'ไม่มีค่า'}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bg-background/50 p-3 rounded border-l-3 border-primary/30">
                              <div className="text-sm">
                                <span className="text-muted-foreground font-medium">รายละเอียด:</span>{" "}
                                <span className="bg-muted px-2 py-1 rounded text-xs">{change.changedDetails}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* VNC Modal */}
      {showVncModal && (
        <Dialog open={showVncModal} onOpenChange={setShowVncModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {vncModalType === "loading" && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                )}
                {vncModalType === "success" && (
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {vncModalType === "error" && (
                  <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {vncModalTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {vncModalMessage}
              </p>
              
              {vncModalType === "error" && vncLinks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">VNC Links:</p>
                  <div className="space-y-2">
                    {vncLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{link.computerName}</p>
                          <p className="text-xs text-muted-foreground">{link.ip}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                          className="ml-2"
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowVncModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}