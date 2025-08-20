import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Network, 
  Pin, 
  BarChart3,
  Bell,
  LogOut
} from "lucide-react";

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  user: { username: string };
}

export function SidebarNav({ activeTab, onTabChange, onLogout, user }: SidebarNavProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "pinned", label: "Pinned", icon: Pin },
    { id: "groups", label: "IP Groups", icon: Network },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: Bell },
  ];

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">IT Asset Monitor</h1>
        <p className="text-sm text-muted-foreground">Real-time tracking</p>
        <p className="text-xs text-muted-foreground mt-2">User: {user.username}</p>
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
                "w-full justify-start gap-3 h-12",
                activeTab === item.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
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