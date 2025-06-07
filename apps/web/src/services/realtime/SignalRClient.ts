/**
 * SignalR Real-time Client
 * Handles real-time data updates from the backend via SignalR
 */

import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { 
  ConnectionConfig, 
  ConnectionStatus, 
  Subscription, 
  SubscriptionManager 
} from '../../types/ApiTypes';

export interface RealTimeEvents {
  'stock:price-update': { symbol: string; price: number; change: number; changePercent: number; volume: number; timestamp: string };
  'stock:trade': { symbol: string; price: number; volume: number; timestamp: string };
  'market:status': { status: 'open' | 'closed' | 'pre-market' | 'after-hours'; timestamp: string };
  'watchlist:update': { userId: string; symbol: string; action: 'added' | 'removed'; timestamp: string };
  'alert:triggered': { userId: string; alertId: string; symbol: string; condition: string; currentPrice: number; timestamp: string };
}

export type RealTimeEventNames = keyof RealTimeEvents;

export class SignalRClient implements SubscriptionManager {
  private connection: HubConnection | null = null;
  private config: ConnectionConfig;
  private connectionStatus: ConnectionStatus;
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempts = 0;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionStatusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.connectionStatus = {
      state: 'Disconnected',
      reconnectAttempts: 0
    };
  }

  // =============================================================================
  // Connection Management
  // =============================================================================

  /**
   * Initialize and start the SignalR connection
   */
  async connect(): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return;
    }

    try {
      this.updateConnectionStatus({ state: 'Connecting' });

      this.connection = new HubConnectionBuilder()
        .withUrl(this.config.url, this.config.options)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.config.reconnect.maxAttempts) {
              return null; // Stop reconnecting
            }
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(this.config.options.logging || LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupConnectionEventHandlers();
      this.setupServerEventHandlers();

      await this.connection.start();
      
      this.updateConnectionStatus({
        state: 'Connected',
        connectionId: this.connection.connectionId || undefined,
        lastConnected: new Date()
      });

      this.reconnectAttempts = 0;
      console.log('SignalR connected successfully');

    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      this.updateConnectionStatus({
        state: 'Disconnected',
        error: error instanceof Error ? error.message : 'Connection failed'
      });
      throw error;
    }
  }

  /**
   * Disconnect from SignalR
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      this.updateConnectionStatus({ state: 'Disconnecting' });
      
      try {
        await this.connection.stop();
        this.updateConnectionStatus({ state: 'Disconnected' });
        console.log('SignalR disconnected');
      } catch (error) {
        console.error('Error disconnecting from SignalR:', error);
        this.updateConnectionStatus({
          state: 'Disconnected',
          error: error instanceof Error ? error.message : 'Disconnect error'
        });
      }
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  // =============================================================================
  // Event Subscription Management
  // =============================================================================
  /**
   * Subscribe to a real-time event (SubscriptionManager interface implementation)
   */
  subscribe(event: string, callback: (data: any) => void): string {
    return this.subscribeToEvent(event as RealTimeEventNames, callback);
  }

  /**
   * Subscribe to a typed real-time event
   */
  subscribeToEvent<T extends RealTimeEventNames>(
    event: T,
    callback: (data: RealTimeEvents[T]) => void
  ): string {
    const id = `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: Subscription = {
      id,
      event,
      callback,
      active: true,
      created: new Date()
    };

    this.subscriptions.set(id, subscription);

    // Add to event handlers map
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);

    // If we're connected, register with the server
    if (this.isConnected()) {
      this.registerServerSubscription(event);
    }

    return id;
  }

  /**
   * Unsubscribe from a real-time event
   */
  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return;

    subscription.active = false;
    this.subscriptions.delete(id);

    // Remove from event handlers
    const handlers = this.eventHandlers.get(subscription.event);
    if (handlers) {
      handlers.delete(subscription.callback);
      
      // If no more handlers for this event, unregister from server
      if (handlers.size === 0) {
        this.eventHandlers.delete(subscription.event);
        if (this.isConnected()) {
          this.unregisterServerSubscription(subscription.event);
        }
      }
    }
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    for (const [id] of this.subscriptions) {
      this.unsubscribe(id);
    }
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  // =============================================================================
  // Stock-specific Subscriptions
  // =============================================================================
  /**
   * Subscribe to real-time price updates for a specific stock
   */
  subscribeToStockPrices(symbol: string, callback: (data: RealTimeEvents['stock:price-update']) => void): string {
    const id = this.subscribeToEvent('stock:price-update', (data) => {
      if (data.symbol === symbol) {
        callback(data);
      }
    });

    // Join the specific stock group on the server
    if (this.isConnected()) {
      this.connection?.invoke('JoinStockGroup', symbol).catch(err => {
        console.error(`Failed to join stock group for ${symbol}:`, err);
      });
    }

    return id;
  }
  /**
   * Subscribe to multiple stocks
   */
  subscribeToMultipleStocks(symbols: string[], callback: (data: RealTimeEvents['stock:price-update']) => void): string {
    const symbolSet = new Set(symbols);
    
    const id = this.subscribeToEvent('stock:price-update', (data) => {
      if (symbolSet.has(data.symbol)) {
        callback(data);
      }
    });

    // Join all stock groups
    if (this.isConnected()) {
      symbols.forEach(symbol => {
        this.connection?.invoke('JoinStockGroup', symbol).catch(err => {
          console.error(`Failed to join stock group for ${symbol}:`, err);
        });
      });
    }

    return id;
  }

  /**
   * Unsubscribe from stock price updates
   */
  unsubscribeFromStock(symbol: string): void {
    if (this.isConnected()) {
      this.connection?.invoke('LeaveStockGroup', symbol).catch(err => {
        console.error(`Failed to leave stock group for ${symbol}:`, err);
      });
    }
  }

  // =============================================================================
  // Connection Event Handlers
  // =============================================================================

  private setupConnectionEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.updateConnectionStatus({
        state: 'Disconnected',
        error: error?.message
      });
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.updateConnectionStatus({
        state: 'Reconnecting',
        error: error?.message
      });
      this.reconnectAttempts++;
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.updateConnectionStatus({
        state: 'Connected',
        connectionId: connectionId || undefined,
        lastConnected: new Date()
      });
      
      // Re-register all active subscriptions
      this.reregisterSubscriptions();
    });
  }

  private setupServerEventHandlers(): void {
    if (!this.connection) return;

    // Stock price updates
    this.connection.on('StockPriceUpdate', (data: RealTimeEvents['stock:price-update']) => {
      this.emitEvent('stock:price-update', data);
    });

    // Trade updates
    this.connection.on('TradeUpdate', (data: RealTimeEvents['stock:trade']) => {
      this.emitEvent('stock:trade', data);
    });

    // Market status updates
    this.connection.on('MarketStatusUpdate', (data: RealTimeEvents['market:status']) => {
      this.emitEvent('market:status', data);
    });

    // Watchlist updates
    this.connection.on('WatchlistUpdate', (data: RealTimeEvents['watchlist:update']) => {
      this.emitEvent('watchlist:update', data);
    });

    // Alert notifications
    this.connection.on('AlertTriggered', (data: RealTimeEvents['alert:triggered']) => {
      this.emitEvent('alert:triggered', data);
    });
  }

  // =============================================================================
  // Server Communication
  // =============================================================================

  private async registerServerSubscription(event: string): Promise<void> {
    if (!this.isConnected()) return;

    try {
      switch (event) {
        case 'stock:price-update':
          await this.connection?.invoke('SubscribeToStockPrices');
          break;
        case 'stock:trade':
          await this.connection?.invoke('SubscribeToTrades');
          break;
        case 'market:status':
          await this.connection?.invoke('SubscribeToMarketStatus');
          break;
        case 'watchlist:update':
          await this.connection?.invoke('SubscribeToWatchlistUpdates');
          break;
        case 'alert:triggered':
          await this.connection?.invoke('SubscribeToAlerts');
          break;
      }
    } catch (error) {
      console.error(`Failed to register server subscription for ${event}:`, error);
    }
  }

  private async unregisterServerSubscription(event: string): Promise<void> {
    if (!this.isConnected()) return;

    try {
      switch (event) {
        case 'stock:price-update':
          await this.connection?.invoke('UnsubscribeFromStockPrices');
          break;
        case 'stock:trade':
          await this.connection?.invoke('UnsubscribeFromTrades');
          break;
        case 'market:status':
          await this.connection?.invoke('UnsubscribeFromMarketStatus');
          break;
        case 'watchlist:update':
          await this.connection?.invoke('UnsubscribeFromWatchlistUpdates');
          break;
        case 'alert:triggered':
          await this.connection?.invoke('UnsubscribeFromAlerts');
          break;
      }
    } catch (error) {
      console.error(`Failed to unregister server subscription for ${event}:`, error);
    }
  }

  private async reregisterSubscriptions(): Promise<void> {
    const activeEvents = new Set<string>();
    
    for (const subscription of this.subscriptions.values()) {
      if (subscription.active) {
        activeEvents.add(subscription.event);
      }
    }

    for (const event of activeEvents) {
      await this.registerServerSubscription(event);
    }
  }

  // =============================================================================
  // Event Emission
  // =============================================================================

  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // =============================================================================
  // Connection Status Management
  // =============================================================================

  private updateConnectionStatus(updates: Partial<ConnectionStatus>): void {
    this.connectionStatus = {
      ...this.connectionStatus,
      ...updates,
      reconnectAttempts: this.reconnectAttempts
    };

    // Notify status listeners
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(this.connectionStatus);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  /**
   * Add a connection status listener
   */
  onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.connectionStatusListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.connectionStatusListeners.delete(listener);
    };
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  /**
   * Send a custom message to the server
   */
  async sendMessage(method: string, ...args: any[]): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      return await this.connection?.invoke(method, ...args);
    } catch (error) {
      console.error(`Failed to send message ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    isConnected: boolean;
    connectionId?: string;
    activeSubscriptions: number;
    reconnectAttempts: number;
    lastConnected?: Date;
  } {
    return {
      isConnected: this.isConnected(),
      connectionId: this.connection?.connectionId || undefined,
      activeSubscriptions: this.getActiveSubscriptions().length,
      reconnectAttempts: this.reconnectAttempts,
      lastConnected: this.connectionStatus.lastConnected
    };
  }
}
