/**
 * Real-time Service
 * Main service for real-time data integration
 */

import { SignalRClient, type RealTimeEvents, type RealTimeEventNames } from './SignalRClient';
import type { ConnectionConfig, ConnectionStatus } from '../../types/ApiTypes';

const DEFAULT_SIGNALR_CONFIG: ConnectionConfig = {
  url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5042'}/hubs/market`,
  options: {
    skipNegotiation: true,
    transport: 1, // WebSockets only
    logging: import.meta.env.DEV ? 2 : 0 // Info level in dev, None in prod
  },
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    delay: 1000
  }
};

export class RealTimeService {
  private signalRClient: SignalRClient;
  private isInitialized = false;

  constructor(config?: Partial<ConnectionConfig>) {
    const mergedConfig = {
      ...DEFAULT_SIGNALR_CONFIG,
      ...config
    };
    
    this.signalRClient = new SignalRClient(mergedConfig);
  }

  // =============================================================================
  // Service Management
  // =============================================================================

  /**
   * Initialize the real-time service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.signalRClient.connect();
      this.isInitialized = true;
      console.log('Real-time service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      throw error;
    }
  }

  /**
   * Shutdown the real-time service
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.signalRClient.unsubscribeAll();
      await this.signalRClient.disconnect();
      this.isInitialized = false;
      console.log('Real-time service shutdown successfully');
    } catch (error) {
      console.error('Error shutting down real-time service:', error);
      throw error;
    }
  }

  /**
   * Check if the service is initialized and connected
   */
  isReady(): boolean {
    return this.isInitialized && this.signalRClient.isConnected();
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.signalRClient.getConnectionStatus();
  }

  // =============================================================================
  // Stock Price Subscriptions
  // =============================================================================

  /**
   * Subscribe to real-time price updates for a specific stock
   */
  subscribeToStock(
    symbol: string,
    callback: (update: RealTimeEvents['stock:price-update']) => void
  ): string {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.subscribeToStockPrices(symbol, callback);
  }

  /**
   * Subscribe to multiple stocks at once
   */
  subscribeToStocks(
    symbols: string[],
    callback: (update: RealTimeEvents['stock:price-update']) => void
  ): string {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.subscribeToMultipleStocks(symbols, callback);
  }

  /**
   * Unsubscribe from a stock
   */
  unsubscribeFromStock(symbol: string): void {
    this.signalRClient.unsubscribeFromStock(symbol);
  }

  // =============================================================================
  // Market Data Subscriptions
  // =============================================================================

  /**
   * Subscribe to market status updates
   */
  subscribeToMarketStatus(
    callback: (status: RealTimeEvents['market:status']) => void
  ): string {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.subscribeToEvent('market:status', callback);
  }

  /**
   * Subscribe to trade updates
   */
  subscribeToTrades(
    callback: (trade: RealTimeEvents['stock:trade']) => void
  ): string {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.subscribeToEvent('stock:trade', callback);
  }

  // =============================================================================
  // User-specific Subscriptions
  // =============================================================================

  /**
   * Subscribe to watchlist updates
   */
  subscribeToWatchlist(
    callback: (update: RealTimeEvents['watchlist:update']) => void
  ): string {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.subscribeToEvent('watchlist:update', callback);
  }

  /**
   * Subscribe to alert notifications
   */
  subscribeToAlerts(
    callback: (alert: RealTimeEvents['alert:triggered']) => void
  ): string {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.subscribeToEvent('alert:triggered', callback);
  }

  // =============================================================================
  // Generic Subscriptions
  // =============================================================================

  /**
   * Subscribe to any real-time event
   */
  subscribe<T extends RealTimeEventNames>(
    event: T,
    callback: (data: RealTimeEvents[T]) => void
  ): string {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.subscribeToEvent(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): void {
    this.signalRClient.unsubscribe(subscriptionId);
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    this.signalRClient.unsubscribeAll();
  }

  // =============================================================================
  // Connection Management
  // =============================================================================

  /**
   * Add a connection status listener
   */
  onConnectionStatusChange(
    listener: (status: ConnectionStatus) => void
  ): () => void {
    return this.signalRClient.onConnectionStatusChange(listener);
  }

  /**
   * Manually reconnect
   */
  async reconnect(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    await this.signalRClient.disconnect();
    await this.signalRClient.connect();
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return this.signalRClient.getConnectionStats();
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions() {
    return this.signalRClient.getActiveSubscriptions();
  }

  /**
   * Send a custom message to the server
   */
  async sendMessage(method: string, ...args: any[]): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Real-time service not initialized. Call initialize() first.');
    }

    return this.signalRClient.sendMessage(method, ...args);
  }
}

// =============================================================================
// Service Instance and Factory
// =============================================================================

let realTimeServiceInstance: RealTimeService | null = null;

/**
 * Get the singleton instance of the real-time service
 */
export function getRealTimeService(config?: Partial<ConnectionConfig>): RealTimeService {
  if (!realTimeServiceInstance) {
    realTimeServiceInstance = new RealTimeService(config);
  }
  return realTimeServiceInstance;
}

/**
 * Create a new real-time service instance (for testing or multiple connections)
 */
export function createRealTimeService(config?: Partial<ConnectionConfig>): RealTimeService {
  return new RealTimeService(config);
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetRealTimeService(): void {
  realTimeServiceInstance = null;
}

// Export types for convenience
export type { RealTimeEvents, RealTimeEventNames, ConnectionStatus, ConnectionConfig };
