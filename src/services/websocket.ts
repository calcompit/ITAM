import { getApiConfig } from '@/config/api';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();
  private updateQueue: any[] = [];
  private isProcessingUpdates = false;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';

  constructor(private url?: string) {
    // Use provided URL or construct from backend URL
    if (!this.url) {
      const config = getApiConfig();
      const backendUrl = config.BACKEND_URL;
      const protocol = backendUrl.startsWith('https:') ? 'wss:' : 'ws:';
      const urlObj = new URL(backendUrl);
      this.url = `${protocol}//${urlObj.hostname}:${urlObj.port || '3002'}`;
      console.log('[WebSocket] Using backend URL:', backendUrl);
      console.log('[WebSocket] WebSocket URL:', this.url);
    }
  }

  connect() {
    if (this.connectionStatus === 'connecting') {
      console.log('[WebSocket] Already connecting, skipping...');
      return;
    }

    this.connectionStatus = 'connecting';
    console.log('[WebSocket] Connecting to:', this.url);
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.addRealtimeIndicator('connected');
        
        // Send authentication message if user is logged in
        const savedUser = localStorage.getItem('it-asset-monitor-user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            this.ws?.send(JSON.stringify({
              type: 'authenticate',
              username: userData.username
            }));
            console.log('[WebSocket] Sent authentication for user:', userData.username);
          } catch (err) {
            console.error('Error parsing user data for WebSocket:', err);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', data.type);
          this.handleMessage(data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        this.connectionStatus = 'disconnected';
        this.addRealtimeIndicator('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        this.connectionStatus = 'error';
        this.addRealtimeIndicator('error');
      };

    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.connectionStatus = 'error';
      this.addRealtimeIndicator('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`[WebSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.log('[WebSocket] Max reconnection attempts reached');
    }
  }

  private handleMessage(data: any) {
    const { type } = data;
    
    // Handle session termination
    if (type === 'session_terminated') {
      console.log('Session terminated by server:', data.message);
      // Clear local storage and redirect to login
      localStorage.removeItem('it-asset-monitor-user');
      window.location.href = '/login';
      return;
    }
    
    // Add realtime update indicator for data updates
    if (type === 'data_update' || type === 'computer_update' || type === 'alert_update' || type === 'alert_notification') {
      this.addRealtimeIndicator('update');
      this.queueUpdate(data);
    }
    
    if (this.listeners.has(type)) {
      this.listeners.get(type)?.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocket] Error in event handler:', error);
        }
      });
    }
  }

  private queueUpdate(data: any) {
    this.updateQueue.push(data);
    if (!this.isProcessingUpdates) {
      this.processUpdateQueue();
    }
  }

  private async processUpdateQueue() {
    this.isProcessingUpdates = true;
    
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      if (update) {
        // Trigger fast animation for the update
        this.triggerFastAnimation(update);
        
        // Small delay to prevent overwhelming the UI
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    this.isProcessingUpdates = false;
  }

  private triggerFastAnimation(data: any) {
    // Add fast animation class to relevant elements
    const { type } = data;
    
    switch (type) {
      case 'computer_update':
        this.addFastAnimationToComputers();
        break;
      case 'alert_update':
        this.addFastAnimationToAlerts();
        break;
      case 'data_update':
        this.addFastAnimationToData();
        break;
    }
  }

  private addFastAnimationToComputers() {
    // Add fast animation to computer cards
    const computerCards = document.querySelectorAll('.computer-card');
    computerCards.forEach(card => {
      card.classList.add('data-update', 'fast-animation');
      setTimeout(() => {
        card.classList.remove('data-update', 'fast-animation');
      }, 300);
    });
  }

  private addFastAnimationToAlerts() {
    // Add fast animation to alert elements
    const alertElements = document.querySelectorAll('.alert-item');
    alertElements.forEach(alert => {
      alert.classList.add('notification-in', 'fast-animation');
      setTimeout(() => {
        alert.classList.remove('notification-in', 'fast-animation');
      }, 200);
    });
  }

  private addFastAnimationToData() {
    // Add fast animation to data elements
    const dataElements = document.querySelectorAll('.data-item');
    dataElements.forEach(element => {
      element.classList.add('data-refresh', 'fast-animation');
      setTimeout(() => {
        element.classList.remove('data-refresh', 'fast-animation');
      }, 150);
    });
  }

  private addRealtimeIndicator(status: 'connected' | 'disconnected' | 'error' | 'update') {
    // Don't show floating indicators anymore - they're now integrated into the status banner
    // The status banner will handle all realtime status display
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'error' {
    return this.connectionStatus;
  }

  // Send message with fast animation trigger
  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
      
      // Trigger fast animation for sent messages
      this.addRealtimeIndicator('update');
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();
