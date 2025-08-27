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
import { useEffect, useState, useRef } from "react";
import { alertService } from "@/services/alert-service";
import { websocketService } from "@/services/websocket";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
  const [isFetchingCount, setIsFetchingCount] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch unread alerts count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      // Prevent multiple simultaneous requests
      if (isFetchingCount) {
        console.log('[Sidebar] Already fetching count, skipping...');
        return;
      }
      
      setIsFetchingCount(true);
      try {
        // Get current user from localStorage
        const savedUser = localStorage.getItem('it-asset-monitor-user');
        let currentUser = 'c270188';
        
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            currentUser = userData.username;
          } catch (err) {
            console.error('Error parsing user data:', err);
          }
        }
        
        // Use dedicated count endpoint
        const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3002'}/api/alerts/${currentUser}/count`);
        if (response.ok) {
          const data = await response.json();
          const newCount = data.unreadCount || 0;
          setUnreadAlertsCount(newCount);
          console.log(`[Sidebar] Unread alerts count updated: ${newCount}`);
        } else {
          console.error('Failed to fetch unread count');
        }
      } catch (error) {
        console.error('Error fetching unread alerts count:', error);
      } finally {
        setIsFetchingCount(false);
      }
    };
    
    fetchUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Listen for WebSocket alert notifications
    const handleAlertNotification = (data: any) => {
      if (data.type === 'alert_notification') {
        // Debounce notifications to prevent multiple rapid calls
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        
        notificationTimeoutRef.current = setTimeout(() => {
          console.log('[Sidebar] Received alert notification, refetching count...');
          fetchUnreadCount();
        }, 1000); // Wait 1 second before refetching
      }
    };
    
    // Listen for alert read events
    const handleAlertRead = (data: any) => {
      if (data.type === 'alert_read' || data.type === 'alert_read_all') {
        console.log('[Sidebar] Received alert read event, refetching count...');
        fetchUnreadCount();
      }
    };
    
    websocketService.on('alert_notification', handleAlertNotification);
    websocketService.on('alert_read', handleAlertRead);
    websocketService.on('alert_read_all', handleAlertRead);
    
    return () => {
      clearInterval(interval);
      websocketService.off('alert_notification', handleAlertNotification);
      websocketService.off('alert_read', handleAlertRead);
      websocketService.off('alert_read_all', handleAlertRead);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Monitor WebSocket status
  useEffect(() => {
    const updateWsStatus = () => {
      setWsStatus(websocketService.getConnectionStatus());
    };

    // Initial status
    updateWsStatus();

    // Listen for WebSocket status changes
    const interval = setInterval(updateWsStatus, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "groups", label: "IP Groups", icon: Network },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined },
  ];



  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-sidebar-foreground">IT Asset Monitor</h1>
          <ThemeToggle size="sm" variant="ghost" />
        </div>
        <p className="text-sm text-sidebar-muted-foreground">Real-time tracking</p>
        <p className="text-xs text-sidebar-muted-foreground mt-2">User: {user.username}</p>
        <div className="mt-2 p-2 bg-sidebar-accent rounded text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-status-online animate-pulse' :
              connectionStatus === 'fallback' ? 'bg-status-warning animate-pulse' :
              'bg-status-offline'
            }`}></div>
            <span className="text-sidebar-muted-foreground">Last Update:</span>
            <span className="font-mono">{lastUpdate.toLocaleTimeString()}</span>
          </div>
          <div className="text-sidebar-muted-foreground mt-1">
            Status: 
            <span className={
              connectionStatus === 'connected' ? 'text-status-online' :
              connectionStatus === 'fallback' ? 'text-status-warning' :
              'text-status-offline'
            }>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'fallback' ? 'Using Cache' :
               'Disconnected'}
            </span>
            {wsStatus === 'connected' && (
              <span className="text-green-500 ml-1">• Realtime</span>
            )}
          </div>
        </div>
      </div>

      {/* Pin Filter Button */}
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant={showPinnedOnly ? "default" : "outline"}
          className={cn(
            "w-full justify-start gap-3 h-12 btn-fast-enhanced",
            showPinnedOnly && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
            "hover:scale-105"
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
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12 relative btn-fast-enhanced stagger-item",
                activeTab === item.id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:scale-105"
              )}
              style={{ '--stagger-index': index } as React.CSSProperties}
              onClick={() => onTabChange(item.id)}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-sidebar-muted-foreground">Light/Dark</span>
          <ThemeToggle size="sm" variant="outline" />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-destructive hover:bg-destructive/10 btn-fast-enhanced hover:scale-105"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}