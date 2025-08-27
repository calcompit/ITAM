import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Bell, 
  Search, 
  Filter, 
  AlertTriangle, 
  Info, 
  Clock, 
  User, 
  Computer,
  CheckCircle,
  X,
  RefreshCw,
  Calendar,
  TrendingUp
} from "lucide-react";
import { apiService, type AlertItem, type APIComputer } from "@/services/api";
import { ComputerDetailsModal } from "@/components/computer-details-modal";

export function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentUser] = useState(() => localStorage.getItem('it-asset-monitor-user') || 'admin');
  
  // Computer details modal state
  const [selectedComputer, setSelectedComputer] = useState<APIComputer | null>(null);
  const [showComputerDetails, setShowComputerDetails] = useState(false);

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, [currentPage]);

  // Filter alerts when search or filters change
  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, selectedSeverity, selectedType]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      // Get current user from localStorage - must be logged in
      const currentUserData = localStorage.getItem('it-asset-monitor-user');
      if (!currentUserData) {
        console.error('No user logged in');
        return;
      }
      
      const currentUser = JSON.parse(currentUserData).username;
      console.log('Loading alerts for user:', currentUser);
      const allAlerts = await apiService.getAlerts(currentUser);
      
      console.log('Received alerts:', allAlerts.length);
      console.log('First alert isRead:', allAlerts[0]?.isRead);
      console.log('Unread count:', allAlerts.filter(a => !a.isRead).length);
      
      // Backend already includes isRead status from database
      setAlerts(allAlerts);
      
      // Calculate total pages (assuming 50 items per page)
      setTotalPages(Math.ceil(allAlerts.length / 50));
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by severity
    if (selectedSeverity !== "all") {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(alert => alert.type === selectedType);
    }

    setFilteredAlerts(filtered);
  };

  const handleMarkAsRead = async (alert: AlertItem) => {
    try {
      // Get current user - must be logged in
      const currentUserData = localStorage.getItem('it-asset-monitor-user');
      if (!currentUserData) {
        console.error('No user logged in');
        return;
      }
      
      const currentUser = JSON.parse(currentUserData).username;
      
      // Call backend API to mark as read
      await apiService.markAlertAsRead(currentUser, alert.id);
      
      // Update state immediately for better UX
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, isRead: true } : a
      ));
      
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Get current user - must be logged in
      const currentUserData = localStorage.getItem('it-asset-monitor-user');
      if (!currentUserData) {
        console.error('No user logged in');
        return;
      }
      
      const currentUser = JSON.parse(currentUserData).username;
      
      // Call backend API to mark all as read
      await apiService.markAllAlertsAsRead(currentUser);
      
      // Update state immediately for better UX
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      
      console.log('All alerts marked as read');
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const handleViewComputerDetails = async (machineID: string) => {
    try {
      // Fetch computer details from API
      const computers = await apiService.getComputers();
      const computer = computers.find(c => c.machineID === machineID);
      
      if (computer) {
        setSelectedComputer(computer);
        setShowComputerDetails(true);
        setShowDetails(false); // Close alert details modal
      } else {
        console.error('Computer not found:', machineID);
      }
    } catch (error) {
      console.error('Error fetching computer details:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertStats = () => {
    const total = alerts.length;
    const unread = alerts.filter(a => !a.isRead).length;
    const highPriority = alerts.filter(a => a.severity === 'high').length;
    const today = alerts.filter(a => {
      const alertDate = new Date(a.changeDate);
      const today = new Date();
      return alertDate.toDateString() === today.toDateString();
    }).length;

    return { total, unread, highPriority, today };
  };

  const stats = getAlertStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleMarkAllAsRead}
          disabled={stats.unread === 0}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark all as read
        </Button>

      </div>

      {/* Modern Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Alerts
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            <p className="text-xs text-blue-600 mt-1">
              All time alerts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              Unread
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats.unread}</div>
            <p className="text-xs text-amber-600 mt-1">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              High Priority
            </CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{stats.highPriority}</div>
            <p className="text-xs text-red-600 mt-1">
              Critical issues
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Today
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.today}</div>
            <p className="text-xs text-green-600 mt-1">
              Recent changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Filters */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <div className="p-1.5 bg-slate-200 rounded-lg">
              <Filter className="h-4 w-4 text-slate-600" />
            </div>
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search alerts by computer name, user, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="status_change">Status Change</option>
                <option value="config_change">Config Change</option>
                <option value="user_change">User Change</option>
                <option value="system_change">System Change</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Alert History ({filteredAlerts.length} alerts)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading alerts...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts found</p>
                <p className="text-xs">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                                  {filteredAlerts.map((alert) => (
                    <Card 
                      key={alert.id} 
                      className={`bg-gradient-to-r from-white to-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
                        !alert.isRead ? 'border-l-blue-500 ring-2 ring-blue-100' : 'border-l-gray-200'
                      } ${
                        alert.severity === 'high' ? 'hover:border-l-red-500' :
                        alert.severity === 'medium' ? 'hover:border-l-yellow-500' :
                        'hover:border-l-blue-500'
                      }`}
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowDetails(true);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`p-2 rounded-full ${
                                alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {getSeverityIcon(alert.severity)}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {alert.title}
                                </h3>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs font-medium ${
                                    alert.severity === 'high' ? 'text-red-600 bg-red-50 border-red-200' :
                                    alert.severity === 'medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                                    'text-blue-600 bg-blue-50 border-blue-200'
                                  }`}
                                >
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                {!alert.isRead && (
                                  <Badge variant="default" className="text-xs bg-blue-500 text-white animate-pulse">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">
                                {alert.description}
                              </p>
                              
                              <div className="flex items-center gap-6 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Computer className="h-3 w-3" />
                                  <span className="font-medium">{alert.computerName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="font-mono text-xs">{alert.username}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(alert.timestamp).toLocaleString('th-TH', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                              </div>
                              
                              {alert.changeDetails && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                    <span className="font-medium">Changes:</span>
                                    <span className="font-mono">{alert.changeDetails.fields?.join(', ')}</span>
                                  </div>
                                  {alert.changeDetails.changes?.slice(0, 2).map((change, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded break-all">
                                        {change.oldValue}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded break-all">
                                        {change.newValue}
                                      </span>
                                    </div>
                                  ))}
                                  {alert.changeDetails.changes?.length > 2 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      +{alert.changeDetails.changes.length - 2} more changes
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!alert.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(alert);
                                }}
                                className="h-8 px-3 text-xs bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-md"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlert(alert);
                                setShowDetails(true);
                              }}
                              className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-gray-100 rounded-full"
                              title="View details"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Alert Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getSeverityIcon(selectedAlert.severity)}
              Alert Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this system change
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Machine ID</label>
                    <div className="max-w-full overflow-x-auto">
                      <button
                        onClick={() => handleViewComputerDetails(selectedAlert.machineID || selectedAlert.id)}
                        className="text-sm font-mono text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded cursor-pointer transition-colors duration-200 text-blue-700 hover:text-blue-800"
                        title="Click to view computer details"
                      >
                        {selectedAlert.machineID || selectedAlert.id}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Changed By</label>
                    <p className="text-sm font-mono text-xs bg-muted px-2 py-1 rounded">
                      {selectedAlert.username}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                    <p className="text-sm">
                      {new Date(selectedAlert.timestamp).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Severity</label>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        selectedAlert.severity === 'high' ? 'text-red-600' :
                        selectedAlert.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}
                    >
                      {selectedAlert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm mt-1">{selectedAlert.description}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Changes</label>
                    {selectedAlert.changeDetails ? (
                      <div className="mt-2 space-y-3">
                        {selectedAlert.changeDetails.changes.map((change, index) => (
                          <div key={index} className="bg-gradient-to-r from-red-50 to-green-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700 font-mono">
                                {change.field}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Changed
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-red-600">Previous Value</label>
                                <p className="text-sm bg-red-50 border border-red-200 rounded px-2 py-1 text-red-700 break-all">
                                  {change.oldValue}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-green-600">New Value</label>
                                <p className="text-sm bg-green-50 border border-green-200 rounded px-2 py-1 text-green-700 break-all">
                                  {change.newValue}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        No detailed changes available
                      </div>
                    )}
                  </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Computer Details Modal */}
      <ComputerDetailsModal
        computer={selectedComputer}
        open={showComputerDetails}
        onClose={() => {
          setShowComputerDetails(false);
          setSelectedComputer(null);
        }}
      />
    </div>
  );
}
