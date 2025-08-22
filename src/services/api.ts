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
      // Return cached data if available, otherwise fallback data
      return this.getCachedOrFallbackData(endpoint) as T;
    }
  }

  private getCachedOrFallbackData(endpoint: string): any {
    console.log(`[CACHE] Using cached data for endpoint: ${endpoint}`);
    
    // Try to get cached data first
    const cachedData = this.getCachedData(endpoint);
    if (cachedData) {
      console.log(`[CACHE] Found cached data for ${endpoint}`);
      return cachedData;
    }
    
    // If no cached data, return empty data instead of fallback
    console.log(`[CACHE] No cached data available for ${endpoint}`);
    return this.getEmptyData(endpoint);
  }

  private getEmptyData(endpoint: string): any {
    switch (endpoint) {
      case '/computers':
        return [];
      case '/ip-groups':
        return [];
      case '/analytics':
        return {
          totalComputers: 0,
          cpuTypes: {},
          ramDistribution: {},
          storageDistribution: {},
          activatedCount: 0,
          notActivatedCount: 0,
          onlineCount: 0,
          offlineCount: 0
        };
      default:
        return [];
    }
  }

  private getCachedData(endpoint: string): any {
    try {
      const cacheKey = `api_cache_${endpoint}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is not too old (1 hour)
        if (data.timestamp && (Date.now() - data.timestamp) < 3600000) {
          return data.data;
        }
      }
    } catch (error) {
      console.error('Error reading cached data:', error);
    }
    return null;
  }

  private setCachedData(endpoint: string, data: any): void {
    try {
      const cacheKey = `api_cache_${endpoint}`;
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  private getFallbackData(endpoint: string): any {
    console.log(`[FALLBACK] Using fallback data for endpoint: ${endpoint}`);
    
    switch (endpoint) {
      case '/computers':
        return [
          {
            machineID: 'DB-OFFLINE-001',
            computerName: 'Database-Offline-Demo-1',
            ipAddresses: ['10.53.64.100'],
            domain: 'CALCOMP.LOCAL',
            sUser: 'admin',
            status: 'offline',
            cpu: { model: 'Intel Core i7-10700', physicalCores: 8, logicalCores: 16 },
            ram: { totalGB: 32, modules: [{ size: 16, type: 'DDR4' }, { size: 16, type: 'DDR4' }] },
            storage: { totalGB: 2000, devices: [{ size: 1000, type: 'SSD' }, { size: 1000, type: 'HDD' }] },
            gpu: [{ model: 'NVIDIA RTX 3060', memory: 12 }],
            nics: [{ name: 'Ethernet', ip: '10.53.64.100' }],
            os: { caption: 'Windows 10 Enterprise', version: '10.0.19045', installDate: '2023-01-15' },
            lastBoot: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            winActivated: true,
            isPinned: false
          },
          {
            machineID: 'DB-OFFLINE-002',
            computerName: 'Database-Offline-Demo-2',
            ipAddresses: ['10.53.64.101'],
            domain: 'CALCOMP.LOCAL',
            sUser: 'user1',
            status: 'offline',
            cpu: { model: 'AMD Ryzen 7 5800X', physicalCores: 8, logicalCores: 16 },
            ram: { totalGB: 64, modules: [{ size: 32, type: 'DDR4' }, { size: 32, type: 'DDR4' }] },
            storage: { totalGB: 4000, devices: [{ size: 2000, type: 'NVMe SSD' }, { size: 2000, type: 'SSD' }] },
            gpu: [{ model: 'AMD Radeon RX 6700 XT', memory: 12 }],
            nics: [{ name: 'Ethernet', ip: '10.53.64.101' }],
            os: { caption: 'Windows 11 Pro', version: '10.0.22621', installDate: '2023-03-20' },
            lastBoot: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
            winActivated: true,
            isPinned: false
          },
          {
            machineID: 'DB-OFFLINE-003',
            computerName: 'Database-Offline-Demo-3',
            ipAddresses: ['10.53.64.102'],
            domain: 'CALCOMP.LOCAL',
            sUser: 'user2',
            status: 'offline',
            cpu: { model: 'Intel Core i5-12400', physicalCores: 6, logicalCores: 12 },
            ram: { totalGB: 16, modules: [{ size: 16, type: 'DDR4' }] },
            storage: { totalGB: 1000, devices: [{ size: 1000, type: 'SSD' }] },
            gpu: [{ model: 'Intel UHD Graphics 730', memory: 0 }],
            nics: [{ name: 'Ethernet', ip: '10.53.64.102' }],
            os: { caption: 'Windows 10 Pro', version: '10.0.19045', installDate: '2023-02-10' },
            lastBoot: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
            winActivated: false,
            isPinned: false
          }
        ];
      
      case '/ip-groups':
        return [
          {
            subnet: '10.53.64.x',
            totalComputers: 3,
            onlineCount: 0,
            offlineCount: 3,
            alertCount: 0
          }
        ];
      
      case '/analytics':
        return {
          totalComputers: 3,
          cpuTypes: { 
            'Intel Core i7': 1, 
            'AMD Ryzen 7': 1, 
            'Intel Core i5': 1 
          },
          ramDistribution: { 
            '16GB': 1, 
            '32GB': 1, 
            '64GB': 1 
          },
          storageDistribution: { 
            '1TB': 1, 
            '2TB': 1, 
            '4TB': 1 
          },
          activatedCount: 2,
          notActivatedCount: 1,
          onlineCount: 0,
          offlineCount: 3
        };
      
      default:
        return [];
    }
  }

  async getComputers(): Promise<APIComputer[]> {
    try {
      const data = await this.request<APIComputer[]>('/computers');
      this.setCachedData('/computers', data);
      return data;
    } catch (error) {
      return this.getCachedOrFallbackData('/computers');
    }
  }

  async getComputerChangelog(machineID: string): Promise<APIComputer['changelog']> {
    return this.request<APIComputer['changelog']>(`/computers/${machineID}/changelog`);
  }

  async getIPGroups(): Promise<IPGroup[]> {
    try {
      const data = await this.request<IPGroup[]>('/ip-groups');
      this.setCachedData('/ip-groups', data);
      return data;
    } catch (error) {
      return this.getCachedOrFallbackData('/ip-groups');
    }
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
