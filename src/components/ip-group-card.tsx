import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Network, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface IPGroup {
  subnet: string;
  totalComputers: number;
  onlineCount: number;
  offlineCount: number;
  alertCount: number;
}

interface IPGroupCardProps {
  group: IPGroup;
  onClick: (subnet: string) => void;
}

export function IPGroupCard({ group, onClick }: IPGroupCardProps) {
  const onlinePercentage = (group.onlineCount / group.totalComputers) * 100;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300",
        "bg-gradient-card border-border shadow-card",
        "hover:shadow-glow hover:scale-105"
      )}
      onClick={() => onClick(group.subnet)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{group.subnet}</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Total computers */}
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{group.totalComputers}</div>
            <div className="text-sm text-muted-foreground">Total Computers</div>
          </div>

          {/* Status breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <StatusIndicator status="online" pulse={false} />
              <span className="font-semibold">{group.onlineCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <StatusIndicator status="offline" pulse={false} />
              <span className="font-semibold">{group.offlineCount}</span>
            </div>
            {group.alertCount > 0 && (
              <div className="flex items-center justify-between">
                <StatusIndicator status="alert" pulse={false} />
                <span className="font-semibold">{group.alertCount}</span>
              </div>
            )}
          </div>

          {/* Online percentage bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Online Rate</span>
              <span className="text-foreground">{onlinePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-status h-2 rounded-full transition-all duration-500"
                style={{ width: `${onlinePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}