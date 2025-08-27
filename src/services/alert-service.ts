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
      let currentUser = 'c270188';
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          currentUser = userData.username;
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `${this.baseUrl}/alerts/${currentUser}?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform SQL data to AlertRecord format and filter out insert records
      return data.alerts?.map((alert: any) => this.transformSqlAlert(alert))
        .filter((alert: AlertRecord | null) => alert !== null) || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      
      // Log more details for debugging
      if (error instanceof TypeError && error.message.includes('Load failed')) {
        console.error('Network error - unable to connect to backend server');
        console.error('Backend URL:', this.baseUrl);
        console.error('Full URL:', `${this.baseUrl}/alerts/${currentUser}?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
      } else if (error.name === 'AbortError') {
        console.error('Request timeout - backend server took too long to respond');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Fetch error - check network connectivity and CORS settings');
      }
      
      // Return empty array when connection fails
      return [];
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
      
      // Return empty summary when connection fails
      return {
        totalAlerts: 0,
        unreadAlerts: 0,
        highPriorityAlerts: 0,
        recentAlerts: []
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


}

export const alertService = new AlertService();
