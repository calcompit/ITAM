import { API_CONFIG } from '../config/api';

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
  private baseUrl = API_CONFIG.API_BASE_URL;

  // Get all alerts with pagination
  async getAlerts(page: number = 1, limit: number = 50, unreadOnly: boolean = false): Promise<AlertRecord[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/alerts?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`,
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
      return data.alerts || [];
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
      return data;
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
      const response = await fetch(`${this.baseUrl}/alerts/${changeID}/read`, {
        method: 'PUT',
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
      const response = await fetch(`${this.baseUrl}/alerts/read-all`, {
        method: 'PUT',
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
      return `IP addresses updated`;
    }
    
    if (changes.domain) {
      return `Domain changed from "${changes.domain.old}" to "${changes.domain.new}"`;
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
