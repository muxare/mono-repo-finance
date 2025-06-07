/**
 * Financial Data Query Hooks
 * React Query hooks for financial data API operations with real-time updates
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState } from 'react';
import { financialDataService } from '../services/api';
import { queryKeys, cacheUtils } from '../services/query/queryClient';
import { getRealTimeService, type RealTimeEvents } from '../services/realtime';
import type {
  StockQueryParameters,
  PriceRangeRequest,
  OHLCRequest
} from '../types/ApiTypes';

// =============================================================================
// Stock Query Hooks
// =============================================================================

export const useStocks = (
  params?: StockQueryParameters,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.stocks.list(params),
    queryFn: () => financialDataService.getStocks(params),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useStockDetails = (
  symbol: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.stocks.detail(symbol),
    queryFn: () => financialDataService.getStockDetails(symbol),
    enabled: options?.enabled !== false && !!symbol,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useStockSearch = (
  query: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.stocks.search(query),
    queryFn: () => financialDataService.searchStocks(query),
    enabled: options?.enabled !== false && query.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// =============================================================================
// Stock Price Query Hooks
// =============================================================================

export const useStockPrices = (
  symbol: string,
  params?: PriceRangeRequest,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.stockPrices.list(symbol, params),
    queryFn: () => financialDataService.getStockPrices(symbol, params),
    enabled: options?.enabled !== false && !!symbol,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useLatestStockPrice = (
  symbol: string,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery({
    queryKey: queryKeys.stockPrices.latest(symbol),
    queryFn: () => financialDataService.getLatestStockPrice(symbol),
    enabled: options?.enabled !== false && !!symbol,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: options?.refetchInterval || 1000 * 60, // Refetch every minute by default
  });
};

export const useOHLCData = (
  symbol: string,
  params?: OHLCRequest,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.stockPrices.ohlc(symbol, params),
    queryFn: () => financialDataService.getOHLCData(symbol, params),
    enabled: options?.enabled !== false && !!symbol,
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (data) => financialDataService.transformOHLCForChart(data), // Transform data for charting
  });
};

// =============================================================================
// Market Data Query Hooks
// =============================================================================

export const useSectors = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.market.sectors(),
    queryFn: () => financialDataService.getSectors(),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useExchanges = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.market.exchanges(),
    queryFn: () => financialDataService.getExchanges(),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// =============================================================================
// Batch Query Hooks
// =============================================================================

export const useMultipleLatestPrices = (
  symbols: string[],
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery({
    queryKey: ['multipleLatestPrices', symbols],
    queryFn: () => financialDataService.getMultipleLatestPrices(symbols),
    enabled: options?.enabled !== false && symbols.length > 0,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: options?.refetchInterval || 1000 * 60, // Refetch every minute
  });
};

export const useMultipleStockPrices = (
  symbols: string[],
  params?: PriceRangeRequest,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['multipleStockPrices', symbols, params],
    queryFn: () => financialDataService.getMultipleStockPrices(symbols, params),
    enabled: options?.enabled !== false && symbols.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// =============================================================================
// Utility Hooks
// =============================================================================

export const useInvalidateStockData = () => {
  return {
    invalidateStocks: () => cacheUtils.invalidateStocks(),
    invalidateStock: (symbol: string) => cacheUtils.invalidateStock(symbol),
    invalidateStockPrices: (symbol?: string) => cacheUtils.invalidateStockPrices(symbol),
    invalidateMarketData: () => cacheUtils.invalidateMarketData(),
    clearAll: () => cacheUtils.clearAll(),
  };
};

export const usePrefetchStockData = () => {
  const queryClient = useQueryClient();
  
  return {
    prefetchStock: (symbol: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.stocks.detail(symbol),
        queryFn: () => financialDataService.getStockDetails(symbol),
        staleTime: 1000 * 60 * 10,
      });
    },
    prefetchLatestPrice: (symbol: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.stockPrices.latest(symbol),
        queryFn: () => financialDataService.getLatestStockPrice(symbol),
        staleTime: 1000 * 30,
      });
    },
  };
};

// =============================================================================
// Performance and Cache Hooks
// =============================================================================

export const useApiPerformance = () => {
  return useQuery({
    queryKey: ['apiPerformance'],
    queryFn: () => financialDataService.getPerformanceStats(),
    refetchInterval: 1000 * 30, // Update every 30 seconds
    staleTime: 1000 * 10, // 10 seconds
  });
};

export const useRateLimitStatus = () => {
  return useQuery({
    queryKey: ['rateLimitStatus'],
    queryFn: () => financialDataService.getRateLimitStatus(),
    refetchInterval: 1000 * 60, // Update every minute
    staleTime: 1000 * 30, // 30 seconds
  });
};

// =============================================================================
// Real-time Hooks
// =============================================================================

/**
 * Hook for real-time stock price updates
 */
export const useRealtimeStockPrice = (symbol: string, enabled = true) => {
  const queryClient = useQueryClient();
  const realTimeService = getRealTimeService();

  const updatePrice = useCallback((update: RealTimeEvents['stock:price-update']) => {    // Update the latest price query
    queryClient.setQueryData(queryKeys.stockPrices.latest(symbol), {
      symbol: update.symbol,
      price: update.price,
      change: update.change,
      changePercent: update.changePercent,
      volume: update.volume,
      lastUpdated: update.timestamp
    });    // Invalidate related queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.stockPrices.list(symbol, {}) });
  }, [queryClient, symbol]);

  useEffect(() => {
    if (!enabled || !symbol) return;

    let subscriptionId: string | null = null;

    const subscribe = async () => {
      try {
        if (!realTimeService.isReady()) {
          await realTimeService.initialize();
        }
        subscriptionId = realTimeService.subscribeToStock(symbol, updatePrice);
      } catch (error) {
        console.error('Failed to subscribe to real-time updates:', error);
      }
    };

    subscribe();

    return () => {
      if (subscriptionId) {
        realTimeService.unsubscribe(subscriptionId);
      }
    };
  }, [symbol, enabled, realTimeService, updatePrice]);

  return {
    connected: realTimeService.isReady(),
    connectionStatus: realTimeService.getStatus()
  };
};

/**
 * Hook for real-time updates on multiple stocks
 */
export const useRealtimeStockPrices = (symbols: string[], enabled = true) => {
  const queryClient = useQueryClient();
  const realTimeService = getRealTimeService();

  const updatePrice = useCallback((update: RealTimeEvents['stock:price-update']) => {
    const symbol = update.symbol;
      // Update the latest price query for this symbol
    queryClient.setQueryData(queryKeys.stockPrices.latest(symbol), {
      symbol: update.symbol,
      price: update.price,
      change: update.change,
      changePercent: update.changePercent,
      volume: update.volume,
      lastUpdated: update.timestamp
    });    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.stockPrices.list(symbol, {}) });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    let subscriptionId: string | null = null;

    const subscribe = async () => {
      try {
        if (!realTimeService.isReady()) {
          await realTimeService.initialize();
        }
        subscriptionId = realTimeService.subscribeToStocks(symbols, updatePrice);
      } catch (error) {
        console.error('Failed to subscribe to real-time updates:', error);
      }
    };

    subscribe();

    return () => {
      if (subscriptionId) {
        realTimeService.unsubscribe(subscriptionId);
      }
    };
  }, [symbols, enabled, realTimeService, updatePrice]);

  return {
    connected: realTimeService.isReady(),
    connectionStatus: realTimeService.getStatus()
  };
};

/**
 * Hook for market status updates
 */
export const useRealtimeMarketStatus = (enabled = true) => {
  const queryClient = useQueryClient();
  const realTimeService = getRealTimeService();

  const updateMarketStatus = useCallback((status: RealTimeEvents['market:status']) => {
    // Update market status in query cache
    queryClient.setQueryData(['market', 'status'], status);
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    let subscriptionId: string | null = null;

    const subscribe = async () => {
      try {
        if (!realTimeService.isReady()) {
          await realTimeService.initialize();
        }
        subscriptionId = realTimeService.subscribeToMarketStatus(updateMarketStatus);
      } catch (error) {
        console.error('Failed to subscribe to market status updates:', error);
      }
    };

    subscribe();

    return () => {
      if (subscriptionId) {
        realTimeService.unsubscribe(subscriptionId);
      }
    };
  }, [enabled, realTimeService, updateMarketStatus]);

  return {
    connected: realTimeService.isReady(),
    connectionStatus: realTimeService.getStatus()
  };
};

/**
 * Combined hook for stock data with real-time updates
 */
export const useStockWithRealtimePrice = (symbol: string, enableRealtime = true) => {
  const stockQuery = useStockDetails(symbol);
  const priceQuery = useLatestStockPrice(symbol);
  const realtimeStatus = useRealtimeStockPrice(symbol, enableRealtime);
  
  return {
    stock: stockQuery.data,
    price: priceQuery.data,
    isLoading: stockQuery.isLoading || priceQuery.isLoading,
    error: stockQuery.error || priceQuery.error,
    realtime: {
      connected: realtimeStatus.connected,
      status: realtimeStatus.connectionStatus
    },
    refetch: () => {
      stockQuery.refetch();
      priceQuery.refetch();
    },
  };
};

/**
 * Hook for managing real-time connection
 */
export const useRealtimeConnection = () => {
  const realTimeService = getRealTimeService();
  const [connectionStatus, setConnectionStatus] = useState(realTimeService.getStatus());

  useEffect(() => {
    const unsubscribe = realTimeService.onConnectionStatusChange(setConnectionStatus);
    return unsubscribe;
  }, [realTimeService]);

  const connect = useCallback(async () => {
    try {
      await realTimeService.initialize();
    } catch (error) {
      console.error('Failed to connect to real-time service:', error);
      throw error;
    }
  }, [realTimeService]);

  const disconnect = useCallback(async () => {
    try {
      await realTimeService.shutdown();
    } catch (error) {
      console.error('Failed to disconnect from real-time service:', error);
      throw error;
    }
  }, [realTimeService]);

  const reconnect = useCallback(async () => {
    try {
      await realTimeService.reconnect();
    } catch (error) {
      console.error('Failed to reconnect to real-time service:', error);
      throw error;
    }
  }, [realTimeService]);

  return {
    status: connectionStatus,
    isConnected: realTimeService.isReady(),
    stats: realTimeService.getConnectionStats(),
    connect,
    disconnect,
    reconnect
  };
};

// =============================================================================
// Custom Hooks for Common Patterns
// =============================================================================

export const useWatchlistPrices = (symbols: string[]) => {
  const { data: prices, ...rest } = useMultipleLatestPrices(symbols, {
    refetchInterval: 1000 * 30, // Update every 30 seconds for watchlist
  });
  
  return {
    prices: prices || {},
    symbols,
    ...rest,
  };
};

export const useStockWithPrice = (symbol: string) => {
  const stockQuery = useStockDetails(symbol);
  const priceQuery = useLatestStockPrice(symbol);
  
  return {
    stock: stockQuery.data,
    price: priceQuery.data,
    isLoading: stockQuery.isLoading || priceQuery.isLoading,
    error: stockQuery.error || priceQuery.error,
    refetch: () => {
      stockQuery.refetch();
      priceQuery.refetch();
    },
  };
};

export const useChartData = (
  symbol: string,
  timeframe: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const params: OHLCRequest = {
    period: timeframe,
    from: fromDate.toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  };
  
  return useOHLCData(symbol, params);
};
