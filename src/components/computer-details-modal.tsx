import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Monitor, HardDrive, MemoryStick, Wifi, Calendar } from "lucide-react";
import { MachineIdDisplay } from "@/components/ui/machine-id-display";
import { ClickableText } from "@/components/ui/clickable-text";
import { formatThailandTime } from "@/lib/utils";

import { APIComputer, apiService } from "@/services/api";

interface ComputerDetailsModalProps {
  computer: APIComputer | null;
  open: boolean;
  onClose: () => void;
}

export function ComputerDetailsModal({ computer, open, onClose }: ComputerDetailsModalProps) {
  const [changelog, setChangelog] = useState<APIComputer['changelog']>([]);
  const [loadingChangelog, setLoadingChangelog] = useState(false);

  useEffect(() => {
    if (computer && open) {
      loadChangelog();
    }
  }, [computer, open]);

  const loadChangelog = async () => {
    if (!computer) return;
    
    try {
      setLoadingChangelog(true);
      const changelogData = await apiService.getComputerChangelog(computer.machineID);
      setChangelog(changelogData || []);
    } catch (error) {
      console.error('Failed to load changelog:', error);
      setChangelog([]);
    } finally {
      setLoadingChangelog(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        {loadingChangelog && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading computer details...</p>
            </div>
          </div>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary IP Address</span>
                    <span className="font-mono">{computer.ipAddresses[0] || "N/A"}</span>
                  </div>
                  {computer.ipAddresses.length > 1 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-sm">All IP Addresses:</span>
                      {computer.ipAddresses.map((ip, index) => (
                        <div key={index} className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                          {ip}
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
    </Dialog>
  );
}