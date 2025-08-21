import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Button } from "@/components/ui/button";
import { Monitor, Pin, PinOff, Eye, MonitorPlay } from "lucide-react";
import { cn, formatThailandTime, formatRelativeTime } from "@/lib/utils";
import { MachineIdDisplay } from "@/components/ui/machine-id-display";
import { ClickableText } from "@/components/ui/clickable-text";
import { Badge } from "@/components/ui/badge";

import { Computer } from "@/data/mock-data";

interface ComputerCardProps {
  computer: Computer;
  onPin: (id: string) => void;
  onClick: (computer: Computer) => void;
  onVNC?: (ip: string, computerName: string) => void;
}

export function ComputerCard({ computer, onPin, onClick, onVNC }: ComputerCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300",
        "bg-gradient-card border-border shadow-card",
        "hover:shadow-glow hover:scale-105"
      )}
      onClick={() => onClick(computer)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <ClickableText 
              text={computer.computerName} 
              title="Click to copy Computer Name"
              className="text-base font-semibold text-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPin(computer.machineID);
            }}
            className="h-8 w-8 p-0"
          >
            {computer.isPinned ? (
              <Pin className="h-4 w-4 text-primary" />
            ) : (
              <PinOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">IP</span>
            <div className="flex items-center gap-2">
              <ClickableText 
                text={computer.ipAddresses[0] || "N/A"}
                title="Click to copy IP address"
                className="text-sm font-mono text-foreground hover:text-blue-600 dark:hover:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              />
              {onVNC && computer.ipAddresses[0] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVNC(computer.ipAddresses[0], computer.computerName);
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                  title={`VNC to ${computer.ipAddresses[0]}`}
                >
                  <MonitorPlay className="h-4 w-4 text-blue-500" />
                </Button>
              )}
            </div>
          </div>
          
          {computer.ipAddresses.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Additional IPs</span>
              <Badge variant="secondary" className="text-xs">
                +{computer.ipAddresses.length - 1} IP{computer.ipAddresses.length > 2 ? 's' : ''}
              </Badge>
            </div>
          )}
          
          {/* Status with relative time */}
          <div className="text-xs">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                computer.status === 'online' 
                  ? 'bg-status-online/20 text-status-online' 
                  : 'bg-status-offline/20 text-status-offline'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  computer.status === 'online' ? 'bg-status-online' : 'bg-status-offline'
                }`} />
                {computer.status === 'online' ? 'Online' : 'Offline'}
              </span>
              <span className="text-muted-foreground">{formatRelativeTime(computer.updatedAt)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">RAM:</span>
              <span className="ml-1 text-foreground">
                {computer.ram?.totalGB ? `${computer.ram.totalGB}GB` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Storage:</span>
              <span className="ml-1 text-foreground">
                {computer.storage?.totalGB ? `${computer.storage.totalGB}GB` : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div>Domain: {computer.domain}</div>
            <div>User: {computer.sUser ? computer.sUser.split('\\').pop() : 'N/A'}</div>
            <div className={`flex items-center gap-1 ${computer.winActivated ? 'text-status-online' : 'text-status-warning'}`}>
              Windows: {computer.winActivated ? 'Activated' : 'Not Activated'}
            </div>
            <div className="mt-2">
              <MachineIdDisplay machineId={computer.machineID} />
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Glow effect for online computers */}
      {computer.status === "online" && (
        <div className="absolute inset-0 bg-gradient-status opacity-5 pointer-events-none" />
      )}
    </Card>
  );
}