import { useState, useEffect, useCallback } from 'react';
import { useStockData } from './useStockData';

export interface StockDataStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  connectionLatency: number;
  dataSource: 'cache' | 'api' | 'realtime';
  dataFreshness: 'fresh' | 'stale' | 'expired';
}

export interface UseStockDataWithStatusResult {
  stockData: any;
  isLoading: boolean;
  error: string | null;
  status: StockDataStatus;
  refreshData: () => void;
  loadStock: (timeframe?: any) => Promise<void>;
}

export const useStockDataWithStatus = (symbol?: string): UseStockDataWithStatusResult => {
  const { stockData, isLoading, error, loadStock } = useStockData(symbol);
  const [status, setStatus] = useState<StockDataStatus>({
    isConnected: true,
    lastUpdate: null,
    connectionLatency: 0,
    dataSource: 'cache',
    dataFreshness: 'fresh'
  });

  // Monitor connection status and data freshness
  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      let dataFreshness: 'fresh' | 'stale' | 'expired' = 'fresh';
      
      if (stockData?.lastUpdated) {
        const timeDiff = now.getTime() - new Date(stockData.lastUpdated).getTime();
        const minutesOld = timeDiff / (1000 * 60);
        
        if (minutesOld > 30) {
          dataFreshness = 'expired';
        } else if (minutesOld > 5) {
          dataFreshness = 'stale';
        }
      }

      setStatus(prev => ({
        ...prev,
        lastUpdate: stockData?.lastUpdated ? new Date(stockData.lastUpdated) : null,
        dataSource: stockData ? (error ? 'cache' : 'api') : 'cache',
        dataFreshness,
        isConnected: !error
      }));
    };

    updateStatus();
    
    // Update status periodically
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [stockData, error]);
  // Measure API latency
  const refreshData = useCallback(() => {
    if (!symbol) return;
    
    const startTime = performance.now();
    
    loadStock().finally(() => {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      setStatus(prev => ({
        ...prev,
        connectionLatency: latency,
        lastUpdate: new Date()
      }));
    });
  }, [loadStock]);

  return {
    stockData,
    isLoading,
    error,
    status,
    refreshData,
    loadStock
  };
};
