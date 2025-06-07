/**
 * Real-time Connection Manager - Handles WebSocket connections via SignalR
 */

import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import type { 
  ConnectionConfig, 
  ConnectionStatus, 
  Subscription, 
  SubscriptionManager 
} from '../../types/ApiTypes';
import { SIGNALR_CONFIG } from './config';

export class RealTimeManager implements SubscriptionManager {
  private connection: HubConnection | null = null;
  private connectionStatus: ConnectionStatus = {
    state: 'Disconnected',
    reconnectAttempts: 0
  };
  private subscriptions = new Map<string, Subscription>();
  private eventListeners = new Map<string, ((status: ConnectionStatus) => void)[]>();
  private config: ConnectionConfig;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = { ...SIGNALR_CONFIG, ...config };
    this.setupConnection();
  }

  private setupConnection(): void {
    this.connection = new HubConnectionBuilder()
      .withUrl(this.config.url, this.config.options)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.config.reconnect.maxAttempts) {
            return null; // Stop retrying
          }
          return this.config.reconnect.delay;
        }
      })
      .configureLogging(this.config.options.logging || LogLevel.Warning)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      this.updateConnectionStatus({
        state: 'Disconnected',
        error: error?.message,
        reconnectAttempts: this.connectionStatus.reconnectAttempts
      });

      if (this.config.reconnect.enabled && error) {
        this.scheduleReconnect();
      }
    });

    this.connection.onreconnecting((error) => {
      this.updateConnectionStatus({
        state: 'Reconnecting',
        error: error?.message,
        reconnectAttempts: this.connectionStatus.reconnectAttempts + 1
      });
    });

    this.connection.onreconnected((connectionId) => {
      this.updateConnectionStatus({
        state: 'Connected',
        connectionId,
        lastConnected: new Date(),
        reconnectAttempts: 0
      });

      // Resubscribe to all active subscriptions
      this.resubscribeAll();
    });
  }

  private updateConnectionStatus(newStatus: Partial<ConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...newStatus };
    this.notifyStatusListeners();
  }

  private notifyStatusListeners(): void {
    const listeners = this.eventListeners.get('connectionStatusChanged') || [];
    listeners.forEach(listener => listener(this.connectionStatus));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.connectionStatus.reconnectAttempts >= this.config.reconnect.maxAttempts) {
      this.updateConnectionStatus({
        state: 'Disconnected',
        error: 'Maximum reconnection attempts reached'
      });
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.config.reconnect.delay);
  }

  private async resubscribeAll(): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.active) {
        try {
          await this.subscribeToHub(subscription.event, subscription.callback);
        } catch (error) {
          console.error(`Failed to resubscribe to ${subscription.event}:`, error);
        }
      }
    }
  }

  private async subscribeToHub(event: string, callback: (data: any) => void): Promise<void> {
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }

    if (this.connection.state !== 'Connected') {
      throw new Error('Connection not established');
    }

    this.connection.on(event, callback);

    // Notify server about subscription if needed
    try {
      await this.connection.invoke('Subscribe', event);
    } catch (error) {
      console.warn(`Server subscription for ${event} failed:`, error);
      // Continue anyway, some events might not require server-side subscription
    }
  }

  private async unsubscribeFromHub(event: string): Promise<void> {
    if (!this.connection) return;

    this.connection.off(event);

    if (this.connection.state === 'Connected') {
      try {
        await this.connection.invoke('Unsubscribe', event);
      } catch (error) {
        console.warn(`Server unsubscription for ${event} failed:`, error);
      }
    }
  }

  // Public API
  public async connect(): Promise<void> {
    if (!this.connection) {
      this.setupConnection();
    }

    if (this.connection!.state === 'Connected') {
      return;
    }

    try {
      this.updateConnectionStatus({ state: 'Connecting' });
      await this.connection!.start();
        this.updateConnectionStatus({
        state: 'Connected',
        connectionId: this.connection!.connectionId || undefined,
        lastConnected: new Date(),
        error: undefined,
        reconnectAttempts: 0
      });
    } catch (error) {
      this.updateConnectionStatus({
        state: 'Disconnected',
        error: error instanceof Error ? error.message : 'Connection failed'
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connection && this.connection.state !== 'Disconnected') {
      this.updateConnectionStatus({ state: 'Disconnecting' });
      await this.connection.stop();
    }

    this.updateConnectionStatus({
      state: 'Disconnected',
      connectionId: undefined,
      error: undefined
    });
  }

  public subscribe(event: string, callback: (data: any) => void): string {
    const id = this.generateSubscriptionId();
    const subscription: Subscription = {
      id,
      event,
      callback,
      active: true,
      created: new Date()
    };

    this.subscriptions.set(id, subscription);

    // Subscribe immediately if connected
    if (this.connectionStatus.state === 'Connected') {
      this.subscribeToHub(event, callback).catch(error => {
        console.error(`Failed to subscribe to ${event}:`, error);
      });
    }

    return id;
  }

  public unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return;

    subscription.active = false;
    this.unsubscribeFromHub(subscription.event);
    this.subscriptions.delete(id);
  }

  public unsubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      this.unsubscribeFromHub(subscription.event);
    }
    this.subscriptions.clear();
  }

  public getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  public onConnectionStatusChanged(listener: (status: ConnectionStatus) => void): () => void {
    const listeners = this.eventListeners.get('connectionStatusChanged') || [];
    listeners.push(listener);
    this.eventListeners.set('connectionStatusChanged', listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.eventListeners.get('connectionStatusChanged') || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.eventListeners.set('connectionStatusChanged', currentListeners);
      }
    };
  }

  public async sendMessage(method: string, ...args: any[]): Promise<any> {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Connection not established');
    }

    return await this.connection.invoke(method, ...args);
  }

  public isConnected(): boolean {
    return this.connectionStatus.state === 'Connected';
  }

  public async restart(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // Predefined subscription helpers for common financial data events
  public subscribeToStockPrices(symbols: string[], callback: (data: any) => void): string {
    return this.subscribe('StockPricesUpdate', (data) => {
      if (symbols.includes(data.symbol)) {
        callback(data);
      }
    });
  }

  public subscribeToMarketData(callback: (data: any) => void): string {
    return this.subscribe('MarketDataUpdate', callback);
  }

  public subscribeToNewsUpdates(callback: (data: any) => void): string {
    return this.subscribe('NewsUpdate', callback);
  }

  public subscribeToCalculationUpdates(callback: (data: any) => void): string {
    return this.subscribe('CalculationComplete', callback);
  }

  public async joinStockRoom(symbol: string): Promise<void> {
    await this.sendMessage('JoinStockRoom', symbol);
  }

  public async leaveStockRoom(symbol: string): Promise<void> {
    await this.sendMessage('LeaveStockRoom', symbol);
  }
}

// Export singleton instance
export const realTimeManager = new RealTimeManager();
