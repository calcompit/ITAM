import { getApiConfig } from '../config/api';

export interface AlertRecord {
  changeID: number;
  machineID: string;
  changeDate: string;
  changedUser: string;
  snapshotOld: any;
  snapshotNew: any;
  changes: string;
  isRead: boolean;
  severity: 'low' | 'medium' | 'high';
  type: 'status_change' | 'config_change' | 'user_change' | 'system_change';
}

export interface AlertSummary {
  totalAlerts: number;
  unreadAlerts: number;
  highPriorityAlerts: number;
  recentAlerts: AlertRecord[];
}

class AlertService {
  private get baseUrl() {
    return getApiConfig().API_BASE_URL;
  }

  // Get all alerts with pagination
  async getAlerts(page: number = 1, limit: number = 50, unreadOnly: boolean = false): Promise<AlertRecord[]> {
    try {
      // Get current user from localStorage
      const savedUser = localStorage.getItem('it-asset-monitor-user');
      let currentUser = 'testuser';
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          currentUser = userData.username;
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }
      
      const response = await fetch(
        `${this.baseUrl}/alerts/${currentUser}?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform SQL data to AlertRecord format and filter out insert records
      return data.alerts?.map((alert: any) => this.transformSqlAlert(alert))
        .filter((alert: AlertRecord | null) => alert !== null) || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      
      // Return mock data for testing
      return this.getMockAlerts();
    }
  }

  // Get alert summary
  async getAlertSummary(): Promise<AlertSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform summary data and filter out insert records
      const transformedRecentAlerts = data.recentAlerts?.map((alert: any) => this.transformSqlAlert(alert))
        .filter((alert: AlertRecord | null) => alert !== null) || [];
      
      return {
        totalAlerts: data.totalAlerts || 0,
        unreadAlerts: data.unreadAlerts || 0,
        highPriorityAlerts: data.highPriorityAlerts || 0,
        recentAlerts: transformedRecentAlerts
      };
    } catch (error) {
      console.error('Error fetching alert summary:', error);
      
      // Return mock summary for testing
      const mockAlerts = this.getMockAlerts();
      return {
        totalAlerts: mockAlerts.length,
        unreadAlerts: mockAlerts.filter(a => !a.isRead).length,
        highPriorityAlerts: mockAlerts.filter(a => a.severity === 'high').length,
        recentAlerts: mockAlerts.slice(0, 5)
      };
    }
  }

  // Mark alert as read
  async markAsRead(changeID: number): Promise<boolean> {
    try {
      // Get current user from localStorage
      const savedUser = localStorage.getItem('it-asset-monitor-user');
      let currentUser = 'testuser';
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          currentUser = userData.username;
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }

      const response = await fetch(`${this.baseUrl}/alerts/${currentUser}/read/${changeID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
  }

  // Mark all alerts as read
  async markAllAsRead(): Promise<boolean> {
    try {
      // Get current user from localStorage
      const savedUser = localStorage.getItem('it-asset-monitor-user');
      let currentUser = 'testuser';
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          currentUser = userData.username;
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }

      const response = await fetch(`${this.baseUrl}/alerts/${currentUser}/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      return false;
    }
  }

  // Get real-time alerts (WebSocket or polling)
  async getRealtimeAlerts(): Promise<AlertRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/realtime`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.alerts || [];
    } catch (error) {
      console.error('Error fetching realtime alerts:', error);
      return [];
    }
  }

  // Parse changes from JSON
  parseChanges(changes: string): any {
    try {
      return JSON.parse(changes);
    } catch (error) {
      console.error('Error parsing changes:', error);
      return {};
    }
  }

  // Get change description
  getChangeDescription(alert: AlertRecord): string {
    const changes = this.parseChanges(alert.changes);
    
    if (changes.status) {
      return `Status changed from ${changes.status.old} to ${changes.status.new}`;
    }
    
    if (changes.computerName) {
      return `Computer name changed from "${changes.computerName.old}" to "${changes.computerName.new}"`;
    }
    
    if (changes.ipAddresses) {
      const oldIPs = Array.isArray(changes.ipAddresses.old) ? changes.ipAddresses.old.join(', ') : changes.ipAddresses.old;
      const newIPs = Array.isArray(changes.ipAddresses.new) ? changes.ipAddresses.new.join(', ') : changes.ipAddresses.new;
      return `IP addresses changed from ${oldIPs} to ${newIPs}`;
    }
    
    if (changes.domain) {
      return `Domain changed from "${changes.domain.old}" to "${changes.domain.new}"`;
    }
    
    if (changes.winActivated) {
      return `Windows activation changed from ${changes.winActivated.old ? 'Activated' : 'Not Activated'} to ${changes.winActivated.new ? 'Activated' : 'Not Activated'}`;
    }
    
    if (changes.lastUpdate) {
      return `Last update changed from ${changes.lastUpdate.old} to ${changes.lastUpdate.new}`;
    }
    
    return 'Configuration updated';
  }

  // Get alert severity
  getAlertSeverity(alert: AlertRecord): 'low' | 'medium' | 'high' {
    const changes = this.parseChanges(alert.changes);
    
    // High priority changes
    if (changes.status && changes.status.new === 'offline') {
      return 'high';
    }
    
    // Medium priority changes
    if (changes.status || changes.ipAddresses) {
      return 'medium';
    }
    
    // Low priority changes
    return 'low';
  }

  // Get alert type
  getAlertType(alert: AlertRecord): 'status_change' | 'config_change' | 'user_change' | 'system_change' {
    const changes = this.parseChanges(alert.changes);
    
    if (changes.status) {
      return 'status_change';
    }
    
    if (changes.computerName || changes.ipAddresses || changes.domain) {
      return 'config_change';
    }
    
    if (changes.user || changes.changedUser) {
      return 'user_change';
    }
    
    return 'system_change';
  }

  // Transform SQL alert data to AlertRecord format
  private transformSqlAlert(sqlAlert: any): AlertRecord | null {
    const snapshotOld = sqlAlert.SnapshotJson_Old ? JSON.parse(sqlAlert.SnapshotJson_Old) : {};
    const snapshotNew = sqlAlert.SnapshotJson_New ? JSON.parse(sqlAlert.SnapshotJson_New) : {};
    
    // Skip insert records (first time records)
    if (this.isInsertRecord(snapshotOld, snapshotNew)) {
      return null;
    }
    
    // Analyze changes between old and new snapshots
    const changes = this.analyzeChanges(snapshotOld, snapshotNew);
    
    return {
      changeID: sqlAlert.ChangeID,
      machineID: sqlAlert.MachineID,
      changeDate: sqlAlert.ChangeDate,
      changedUser: sqlAlert.ChangedSUser,
      snapshotOld,
      snapshotNew,
      changes: JSON.stringify(changes),
      isRead: false, // Default to unread
      severity: this.determineSeverity(changes),
      type: this.determineType(changes)
    };
  }

  // Check if this is an insert record (first time record)
  private isInsertRecord(snapshotOld: any, snapshotNew: any): boolean {
    // Check if old snapshot is empty/null and new snapshot has data
    const isOldEmpty = !snapshotOld || 
                      Object.keys(snapshotOld).length === 0 || 
                      snapshotOld === null || 
                      snapshotOld === undefined;
    
    const isNewHasData = snapshotNew && 
                        Object.keys(snapshotNew).length > 0 && 
                        snapshotNew !== null && 
                        snapshotNew !== undefined;
    
    return isOldEmpty && isNewHasData;
  }

  // Analyze changes between old and new snapshots
  private analyzeChanges(oldSnapshot: any, newSnapshot: any): any {
    const changes: any = {};
    
    // Check status changes
    if (oldSnapshot.status !== newSnapshot.status) {
      changes.status = {
        old: oldSnapshot.status,
        new: newSnapshot.status
      };
    }
    
    // Check computer name changes
    if (oldSnapshot.computerName !== newSnapshot.computerName) {
      changes.computerName = {
        old: oldSnapshot.computerName,
        new: newSnapshot.computerName
      };
    }
    
    // Check IP address changes
    if (JSON.stringify(oldSnapshot.ipAddresses) !== JSON.stringify(newSnapshot.ipAddresses)) {
      changes.ipAddresses = {
        old: oldSnapshot.ipAddresses,
        new: newSnapshot.ipAddresses
      };
    }
    
    // Check domain changes
    if (oldSnapshot.domain !== newSnapshot.domain) {
      changes.domain = {
        old: oldSnapshot.domain,
        new: newSnapshot.domain
      };
    }
    
    // Check Windows activation changes
    if (oldSnapshot.winActivated !== newSnapshot.winActivated) {
      changes.winActivated = {
        old: oldSnapshot.winActivated,
        new: newSnapshot.winActivated
      };
    }
    
    // Check last update changes
    if (oldSnapshot.lastUpdate !== newSnapshot.lastUpdate) {
      changes.lastUpdate = {
        old: oldSnapshot.lastUpdate,
        new: newSnapshot.lastUpdate
      };
    }
    
    return changes;
  }

  // Determine severity based on changes
  private determineSeverity(changes: any): 'low' | 'medium' | 'high' {
    // High priority: status changes to offline
    if (changes.status && changes.status.new === 'offline') {
      return 'high';
    }
    
    // Medium priority: status changes, IP changes, computer name changes
    if (changes.status || changes.ipAddresses || changes.computerName) {
      return 'medium';
    }
    
    // Low priority: other changes
    return 'low';
  }

  // Determine type based on changes
  private determineType(changes: any): 'status_change' | 'config_change' | 'user_change' | 'system_change' {
    if (changes.status) {
      return 'status_change';
    }
    
    if (changes.computerName || changes.ipAddresses || changes.domain) {
      return 'config_change';
    }
    
    if (changes.winActivated || changes.lastUpdate) {
      return 'system_change';
    }
    
    return 'config_change';
  }

  // Mock data for testing
  private getMockAlerts(): AlertRecord[] {
    return [
      {
        changeID: 1,
        machineID: "PC001",
        changeDate: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        changedUser: "admin",
        snapshotOld: { status: "online", computerName: "PC001" },
        snapshotNew: { status: "offline", computerName: "PC001" },
        changes: JSON.stringify({ status: { old: "online", new: "offline" } }),
        isRead: false,
        severity: "high",
        type: "status_change"
      },
      {
        changeID: 2,
        machineID: "PC002",
        changeDate: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        changedUser: "user1",
        snapshotOld: { computerName: "PC002-OLD" },
        snapshotNew: { computerName: "PC002-NEW" },
        changes: JSON.stringify({ computerName: { old: "PC002-OLD", new: "PC002-NEW" } }),
        isRead: false,
        severity: "medium",
        type: "config_change"
      },
      {
        changeID: 3,
        machineID: "PC003",
        changeDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        changedUser: "system",
        snapshotOld: { ipAddresses: ["192.168.1.100"] },
        snapshotNew: { ipAddresses: ["192.168.1.101"] },
        changes: JSON.stringify({ ipAddresses: { old: ["192.168.1.100"], new: ["192.168.1.101"] } }),
        isRead: true,
        severity: "low",
        type: "config_change"
      },
      {
        changeID: 4,
        machineID: "PC004",
        changeDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        changedUser: "admin",
        snapshotOld: { status: "offline" },
        snapshotNew: { status: "online" },
        changes: JSON.stringify({ status: { old: "offline", new: "online" } }),
        isRead: false,
        severity: "medium",
        type: "status_change"
      },
      {
        changeID: 5,
        machineID: "PC005",
        changeDate: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        changedUser: "user2",
        snapshotOld: { domain: "old-domain.local" },
        snapshotNew: { domain: "new-domain.local" },
        changes: JSON.stringify({ domain: { old: "old-domain.local", new: "new-domain.local" } }),
        isRead: true,
        severity: "low",
        type: "config_change"
      }
    ];
  }
}

export const alertService = new AlertService();
