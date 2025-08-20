import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "offline" | "alert";
  className?: string;
  pulse?: boolean;
}

export function StatusIndicator({ status, className, pulse = true }: StatusIndicatorProps) {
  const statusColors = {
    online: "bg-status-online",
    offline: "bg-status-offline", 
    alert: "bg-status-warning"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "w-3 h-3 rounded-full",
          statusColors[status],
          pulse && "animate-pulse"
        )}
      />
      <span className="text-sm font-medium capitalize text-foreground">
        {status}
      </span>
    </div>
  );
}