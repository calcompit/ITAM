import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Network, 
  Pin, 
  BarChart3,
  Bell,
  LogOut,
  Home
} from "lucide-react";
import { useStatus } from "@/contexts/StatusContext";
import { useEffect, useState } from "react";
import { alertService } from "@/services/alert-service";
import { websocketService } from "@/services/websocket";

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  user: { username: string };
  showPinnedOnly: boolean;
  onPinnedToggle: () => void;
  pinnedCount: number;
}

export const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    variant: "default",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    variant: "ghost",
  },
  {
    title: "Alerts",
    href: "/alerts",
    icon: Bell,
    variant: "ghost",
  },
] as const

export function SidebarNav({ activeTab, onTabChange, onLogout, user, showPinnedOnly, onPinnedToggle, pinnedCount }: SidebarNavProps) {
  const { lastUpdate, connectionStatus } = useStatus();
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  
  // Fetch unread alerts count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const alerts = await alertService.getAlerts(1, 100, true); // Get unread only
        setUnreadAlertsCount(alerts.length);
      } catch (error) {
        console.error('Error fetching unread alerts count:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Listen for WebSocket alert notifications
    const handleAlertNotification = (data: any) => {
      if (data.type === 'alert_notification') {
        // Increment unread count when new alert arrives
        setUnreadAlertsCount(prev => prev + 1);
      }
    };
    
    websocketService.on('alert_notification', handleAlertNotification);
    
    return () => {
      clearInterval(interval);
      websocketService.off('alert_notification', handleAlertNotification);
    };
  }, []);
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "groups", label: "IP Groups", icon: Network },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined },
  ];



  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">IT Asset Monitor</h1>
        <p className="text-sm text-muted-foreground">Real-time tracking</p>
        <p className="text-xs text-muted-foreground mt-2">User: {user.username}</p>
        <div className="mt-2 p-2 bg-muted rounded text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'fallback' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-muted-foreground">Last Update:</span>
            <span className="font-mono">{lastUpdate.toLocaleTimeString()}</span>
          </div>
          <div className="text-muted-foreground mt-1">
            Status: <span className={
              connectionStatus === 'connected' ? 'text-green-600' :
              connectionStatus === 'fallback' ? 'text-yellow-600' :
              'text-red-600'
            }>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'fallback' ? 'Using Cache' :
               'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Pin Filter Button */}
      <div className="p-4 border-b border-border">
        <Button
          variant={showPinnedOnly ? "default" : "outline"}
          className={cn(
            "w-full justify-start gap-3 h-12",
            showPinnedOnly && "bg-blue-600 hover:bg-blue-700"
          )}
          onClick={onPinnedToggle}
        >
          <Pin className="h-5 w-5" />
          <div className="flex-1 text-left">
            <div className="font-medium">
              {showPinnedOnly ? "Show All" : "Pinned Only"}
            </div>
            <div className="text-xs opacity-75">
              {pinnedCount} computers pinned
            </div>
          </div>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12 relative",
                activeTab === item.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}