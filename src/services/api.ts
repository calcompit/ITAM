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
      // Return fallback data instead of throwing error
      return this.getFallbackData(endpoint) as T;
    }
  }

  private getFallbackData(endpoint: string): any {
    console.log(`[FALLBACK] Using fallback data for endpoint: ${endpoint}`);
    
    switch (endpoint) {
      case '/computers':
        return [
          {
            machineID: 'FALLBACK-001',
            computerName: 'Fallback-PC-1',
            ipAddresses: ['192.168.1.100'],
            domain: 'FALLBACK.LOCAL',
            sUser: 'fallback_user',
            status: 'offline',
            cpu: { model: 'Intel Core i5-8400', cores: 6, speed: 2.8 },
            ram: { totalGB: 8, modules: [{ size: 8, type: 'DDR4' }] },
            storage: { totalGB: 500, drives: [{ size: 500, type: 'SSD' }] },
            gpu: { model: 'Intel UHD Graphics 630', memory: 0 },
            network: { adapters: [{ name: 'Ethernet', ip: '192.168.1.100' }] },
            lastBoot: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            winActivated: true,
            isPinned: false
          },
          {
            machineID: 'FALLBACK-002',
            computerName: 'Fallback-PC-2',
            ipAddresses: ['192.168.1.101'],
            domain: 'FALLBACK.LOCAL',
            sUser: 'fallback_user',
            status: 'offline',
            cpu: { model: 'AMD Ryzen 5 3600', cores: 6, speed: 3.6 },
            ram: { totalGB: 16, modules: [{ size: 16, type: 'DDR4' }] },
            storage: { totalGB: 1000, drives: [{ size: 1000, type: 'HDD' }] },
            gpu: { model: 'NVIDIA GTX 1660', memory: 6 },
            network: { adapters: [{ name: 'Ethernet', ip: '192.168.1.101' }] },
            lastBoot: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            winActivated: false,
            isPinned: false
          }
        ];
      
      case '/ip-groups':
        return [
          {
            subnet: '192.168.1.x',
            totalComputers: 2,
            onlineCount: 0,
            offlineCount: 2,
            alertCount: 0
          }
        ];
      
      case '/analytics':
        return {
          totalComputers: 2,
          cpuTypes: { 'Intel Core i5': 1, 'AMD Ryzen 5': 1 },
          ramDistribution: { '8GB': 1, '16GB': 1 },
          storageDistribution: { '500GB': 1, '1TB': 1 },
          activatedCount: 1,
          notActivatedCount: 1,
          onlineCount: 0,
          offlineCount: 2
        };
      
      default:
        return [];
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
