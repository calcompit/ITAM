import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Computer, 
  HardDrive, 
  MemoryStick,
  Network,
  User
} from "lucide-react";
import { formatThailandTime } from "@/lib/utils";
import { apiService, type AlertItem } from "@/services/api";

// Get current logged in user from localStorage
const getCurrentUser = (): string => {
  try {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).username : 'admin'; // fallback to admin
  } catch (error) {
    return 'admin';
  }
};

// Load read alerts from localStorage
const loadReadAlerts = (): string[] => {
  try {
    const readAlerts = localStorage.getItem('readAlerts');
    return readAlerts ? JSON.parse(readAlerts) : [];
  } catch (error) {
    return [];
  }
};

// Save read alerts to localStorage
const saveReadAlerts = (readAlertIds: string[]) => {
  try {
    localStorage.setItem('readAlerts', JSON.stringify(readAlertIds));
  } catch (error) {
    // Ignore localStorage errors
  }
};



export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "critical" | "high" | "historical">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load alerts data
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser();
        const alertsData = await apiService.getAlerts(currentUser);
        
        // Load read status from localStorage
        const readAlertIds = loadReadAlerts();
        const alertsWithReadStatus = alertsData.map(alert => ({
          ...alert,
          isRead: readAlertIds.includes(alert.id)
        }));
        
        setAlerts(alertsWithReadStatus);
        setError(null);
      } catch (err) {
        console.error('Failed to load alerts:', err);
        setError('Failed to load alerts from server');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const markAsRead = async (alertId: string) => {
    try {
      const currentUser = getCurrentUser();
      await apiService.markAlertAsRead(currentUser, alertId);
      
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      
      // Update localStorage
      const readAlertIds = loadReadAlerts();
      if (!readAlertIds.includes(alertId)) {
        saveReadAlerts([...readAlertIds, alertId]);
      }
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const currentUser = getCurrentUser();
      
      // Mark all unread alerts as read
      const unreadAlerts = alerts.filter(alert => !alert.isRead);
      for (const alert of unreadAlerts) {
        await apiService.markAlertAsRead(currentUser, alert.id);
      }
      
      setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
      
      // Update localStorage
      const allAlertIds = alerts.map(alert => alert.id);
      saveReadAlerts(allAlertIds);
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  const getFilteredAlerts = () => {
    switch (filter) {
      case "unread":
        return alerts.filter(alert => !alert.isRead);
      case "critical":
        return alerts.filter(alert => alert.severity === "critical");
      case "high":
        return alerts.filter(alert => alert.severity === "high" || alert.severity === "critical");
      case "historical":
        return alerts.filter(alert => alert.isOldAlert);
      default:
        return alerts;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-100 border-blue-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hardware":
        return <Computer className="h-4 w-4" />;
      case "network":
        return <Network className="h-4 w-4" />;
      case "system":
        return <AlertTriangle className="h-4 w-4" />;
      case "security":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getChangeIcon = (field: string) => {
    if (field.includes("RAM")) return <MemoryStick className="h-4 w-4" />;
    if (field.includes("Storage")) return <HardDrive className="h-4 w-4" />;
    if (field.includes("IP")) return <Network className="h-4 w-4" />;
    if (field.includes("User")) return <User className="h-4 w-4" />;
    return <Computer className="h-4 w-4" />;
  };

  const filteredAlerts = getFilteredAlerts();
  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Alerts</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Alerts</h1>
          <p className="text-muted-foreground">
            Monitor system changes and notifications for {getCurrentUser()} ({unreadCount} unread)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
            <Clock className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-warning">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.severity === "critical").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.severity === "high").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Alerts
        </Button>
        <Button 
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
        <Button 
          variant={filter === "high" ? "default" : "outline"}
          onClick={() => setFilter("high")}
        >
          High Priority
        </Button>
        <Button 
          variant={filter === "critical" ? "default" : "outline"}
          onClick={() => setFilter("critical")}
        >
          Critical
        </Button>
        <Button 
          variant={filter === "historical" ? "default" : "outline"}
          onClick={() => setFilter("historical")}
        >
          📖 Historical
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={`bg-gradient-card border-border ${!alert.isRead ? 'border-primary/50' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(alert.type)}
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{alert.title}</h3>
                      {!alert.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-2">
                      {alert.description}
                      {alert.isOldAlert && (
                        <span className="inline-block ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                          📖 Historical Alert
                        </span>
                      )}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Computer className="h-3 w-3" />
                        {alert.computerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatThailandTime(alert.timestamp)}
                      </span>
                    </div>
                    
                    {alert.changeDetails && (
                      <Alert className="mt-3 bg-muted/30">
                        <div className="flex items-center gap-2">
                          {getChangeIcon(alert.changeDetails.field)}
                          <AlertDescription>
                            <strong>{alert.changeDetails.field}:</strong>{" "}
                            <span className="text-red-600">{alert.changeDetails.oldValue}</span>
                            {" → "}
                            <span className="text-green-600">{alert.changeDetails.newValue}</span>
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}
                  </div>
                </div>
                
                {!alert.isRead && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => markAsRead(alert.id)}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <Card className="bg-gradient-card border-border">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No alerts found</h3>
              <p className="text-muted-foreground">
                {filter === "unread" ? "All alerts have been read." : "No alerts match the current filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}