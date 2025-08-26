import { API_CONFIG } from './api-config';

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
      return data;
    } catch (error) {
      console.error('Error fetching alert summary:', error);
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
}

export const alertService = new AlertService();
