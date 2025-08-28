import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Button } from "@/components/ui/button";
import { Monitor, Pin, PinOff, MonitorCheck } from "lucide-react";
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
  isUpdated?: boolean;
  updateType?: 'status' | 'hud' | 'general' | 'new';
  changedFields?: string[];
}

export function ComputerCard({ computer, onPin, onClick, onVNC, isUpdated, updateType, changedFields }: ComputerCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer computer-card card-fast-hover fast-animation",
        "bg-gradient-card border-border hover:border-primary/50 min-h-[280px]",
        isUpdated && "data-update ring-2 ring-primary ring-opacity-50",
        isUpdated && updateType === 'status' && "status-online-update",
        isUpdated && updateType === 'hud' && "hud-version-update",
        isUpdated && updateType === 'general' && "real-time-update",
        isUpdated && updateType === 'new' && "real-time-update-slide",
        isUpdated && "updating"
      )}
      onClick={() => onClick(computer)}
    >
      {/* Beautiful change indicator */}
      {isUpdated && changedFields && changedFields.length > 0 && (
        <div className="change-indicator-beautiful">
          <div className="change-badge">
            <span className="change-icon">✨</span>
            <span className="change-text">
              {changedFields.length === 1 
                ? changedFields[0] 
                : `${changedFields.length} fields updated`
              }
            </span>
          </div>
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <ClickableText 
              text={computer.computerName} 
              title="Click to copy Computer Name"
              className="text-base font-semibold text-card-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={computer.isPinned ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPin(computer.machineID);
            }}
            className={`h-8 w-8 p-0 btn-fast-enhanced hover:scale-110 ${computer.isPinned ? "bg-primary hover:bg-primary/90" : "hover:bg-accent"}`}
            title={computer.isPinned ? "Unpin Computer" : "Pin Computer"}
          >
            {computer.isPinned ? (
              <Pin className="h-4 w-4 text-white" />
            ) : (
              <PinOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full">
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Primary IP</span>
            <div className="flex items-center gap-2">
              <ClickableText 
                text={computer.ipAddresses[0] || "N/A"}
                className={cn(
                  "text-sm font-mono text-card-foreground hover:text-primary",
                  isUpdated && changedFields?.includes('ipAddress') && "updating-field"
                )}
                onClick={(e) => e.stopPropagation()}
              />
              {onVNC && computer.ipAddresses[0] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onVNC) {
                      onVNC(computer.ipAddresses[0], computer.computerName);
                    }
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent btn-fast-enhanced hover:scale-110"
                  title="VNC Connection"
                >
                  <MonitorCheck className="h-4 w-4 text-primary" />
                </Button>
              )}
            </div>
          </div>
          
                    {/* Additional IPs - Always show for consistent card height */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Additional IPs</span>
            {computer.ipAddresses.length > 1 ? (
              <Badge variant="secondary" className="text-xs">
                +{computer.ipAddresses.length - 1} IP{computer.ipAddresses.length > 2 ? 's' : ''}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground/50">None</span>
            )}
          </div>
          
          {/* Status with relative time */}
          <div className="text-xs">
            <div className="flex items-center justify-between">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium status-indicator hover:scale-110",
                computer.status === 'online' ? 'online' : 'offline',
                isUpdated && updateType === 'status' && "status-online-update",
                isUpdated && updateType === 'status' && "updating"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full status-dot",
                  computer.status === 'online' ? 'bg-status-online' : 'bg-status-offline'
                )} />
                {computer.status === 'online' ? 'Online' : 'Offline'}
              </span>
              <span className="text-muted-foreground">{formatRelativeTime(computer.updatedAt)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={cn(
              isUpdated && changedFields?.includes('ram') && "updating-field"
            )}>
              <span className="text-muted-foreground">RAM:</span>
              <span className="ml-1 text-card-foreground">
                {computer.ram?.totalGB ? `${computer.ram.totalGB}GB` : 'N/A'}
              </span>
            </div>
            <div className={cn(
              isUpdated && changedFields?.includes('storage') && "updating-field"
            )}>
              <span className="text-muted-foreground">Storage:</span>
              <span className="ml-1 text-card-foreground">
                {computer.storage?.totalGB ? `${computer.storage.totalGB}GB` : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-auto">
            <div className={cn(
              isUpdated && changedFields?.includes('domain') && "updating-field"
            )}>
              Domain: {computer.domain}
            </div>
            <div className={cn(
              isUpdated && changedFields?.includes('user') && "updating-field"
            )}>
              User: {computer.sUser ? computer.sUser.split('\\').pop() : 'N/A'}
            </div>
            {computer.hudVersion && (
              <div className={cn(
                "flex items-center gap-1 text-primary font-medium",
                isUpdated && updateType === 'hud' && "real-time-update-glow",
                isUpdated && changedFields?.includes('hudVersion') && "updating-field"
              )}>
                Tracker: {computer.hudVersion}
              </div>
            )}
            <div className={cn(
              `flex items-center gap-1 ${computer.winActivated ? 'text-status-online' : 'text-status-warning'}`,
              isUpdated && changedFields?.includes('windows') && "updating-field"
            )}>
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