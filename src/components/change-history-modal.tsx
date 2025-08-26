import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Computer, Activity } from "lucide-react";
import { formatChangeTimestamp, getChangeTypeIcon, getChangeTypeColor, type ChangeRecord } from "@/lib/change-history";

interface ChangeHistoryModalProps {
  open: boolean;
  onClose: () => void;
  changeHistory: ChangeRecord[];
}

export function ChangeHistoryModal({ open, onClose, changeHistory }: ChangeHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Change History
          </DialogTitle>
          <DialogDescription>
            Recent changes and activities in the system
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {changeHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No changes recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changeHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-lg">{getChangeTypeIcon(record.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{record.description}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getChangeTypeColor(record.type)}`}
                      >
                        {record.type.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {record.computerName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Computer className="h-3 w-3" />
                        <span>{record.computerName}</span>
                        {record.ipAddress && (
                          <span className="font-mono">({record.ipAddress})</span>
                        )}
                      </div>
                    )}
                    
                    {record.oldValue && record.newValue && (
                      <div className="text-xs text-muted-foreground mb-1">
                        <span className="line-through">{record.oldValue}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{record.newValue}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatChangeTimestamp(record.timestamp)}</span>
                      </div>
                      {record.user && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{record.user}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {changeHistory.length} changes recorded
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
