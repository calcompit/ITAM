import { Computer } from '../data/mock-data';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;

export interface APIComputer extends Computer {
  changelog?: Array<{
    changeID: string;
    changeDate: string;
    changedSUser: string;
    eventType: "INSERT" | "UPDATE" | "DELETE";
    changedCount: number;
    changedFields: string;
    changedDetails: Array<{
      field: string;
      old: string;
      new: string;
    }>;
  }>;
}

export interface IPGroup {
  subnet: string;
  totalComputers: number;
  onlineCount: number;
  offlineCount: number;
  alertCount: number;
}

export interface AlertItem {
  id: string;
  type: "hardware" | "network" | "system" | "security";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  computerName: string;
  timestamp: string;
  username: string;
  isRead: boolean;
  isOldAlert?: boolean; // Flag to indicate this is an old alert
  changeDetails?: {
    field: string;
    oldValue: string;
    newValue: string;
  };
}

class ApiService {
  private async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getComputers(): Promise<APIComputer[]> {
    return this.request<APIComputer[]>('/computers');
  }

  async getComputerChangelog(machineID: string): Promise<APIComputer['changelog']> {
    return this.request<APIComputer['changelog']>(`/computers/${machineID}/changelog`);
  }

  async getIPGroups(): Promise<IPGroup[]> {
    return this.request<IPGroup[]>('/ip-groups');
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  async login(username: string, password: string): Promise<{ success: boolean; message: string; user?: { username: string } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  }

  async getComputerStatus(machineID: string): Promise<{
    machineID: string;
    computerName: string;
    updatedAt: string;
    minutesSinceUpdate: number;
    status: 'online' | 'offline';
    isOnline: boolean;
  }> {
    return this.request<{
      machineID: string;
      computerName: string;
      updatedAt: string;
      minutesSinceUpdate: number;
      status: 'online' | 'offline';
      isOnline: boolean;
    }>(`/computers/${machineID}/status`);
  }

  async getAnalytics(): Promise<{
    totalComputers: number;
    cpuTypes: Record<string, number>;
    ramDistribution: Record<string, number>;
    storageDistribution: Record<string, number>;
    activatedCount: number;
    notActivatedCount: number;
    onlineCount: number;
    offlineCount: number;
  }> {
    return this.request<{
      totalComputers: number;
      cpuTypes: Record<string, number>;
      ramDistribution: Record<string, number>;
      storageDistribution: Record<string, number>;
      activatedCount: number;
      notActivatedCount: number;
      onlineCount: number;
      offlineCount: number;
    }>('/analytics');
  }

  async getAlerts(username: string): Promise<AlertItem[]> {
    return this.request<AlertItem[]>(`/alerts/${username}`);
  }

  async markAlertAsRead(username: string, alertId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${username}/read/${alertId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Mark alert as read request failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
