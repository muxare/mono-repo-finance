/**
 * React Query Setup and Configuration
 * Configures React Query client with optimized settings for financial data
 */

import { QueryClient } from '@tanstack/react-query';

// Configure React Query client with optimized settings for financial data
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data is stale after this time
      gcTime: 1000 * 60 * 30, // 30 minutes - cache garbage collection time
      retry: (failureCount, error: any) => {
        // Don't retry on authentication or client errors
        if (error?.type === 'AUTHENTICATION_ERROR' || 
            error?.type === 'AUTHORIZATION_ERROR' ||
            error?.type === 'CLIENT_ERROR') {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
      refetchOnWindowFocus: false, // Don't refetch on window focus by default
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1, // Only retry mutations once
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Query key factory for consistent key generation
export const queryKeys = {
  // Stock queries
  stocks: {
    all: ['stocks'] as const,
    lists: () => [...queryKeys.stocks.all, 'list'] as const,
    list: (params: any) => [...queryKeys.stocks.lists(), params] as const,
    details: () => [...queryKeys.stocks.all, 'detail'] as const,
    detail: (symbol: string) => [...queryKeys.stocks.details(), symbol] as const,
    search: (query: string) => [...queryKeys.stocks.all, 'search', query] as const,
  },
  
  // Stock price queries
  stockPrices: {
    all: ['stockPrices'] as const,
    lists: () => [...queryKeys.stockPrices.all, 'list'] as const,
    list: (symbol: string, params: any) => [...queryKeys.stockPrices.lists(), symbol, params] as const,
    latest: (symbol: string) => [...queryKeys.stockPrices.all, 'latest', symbol] as const,
    ohlc: (symbol: string, params: any) => [...queryKeys.stockPrices.all, 'ohlc', symbol, params] as const,
  },
  
  // Market data queries
  market: {
    all: ['market'] as const,
    sectors: () => [...queryKeys.market.all, 'sectors'] as const,
    exchanges: () => [...queryKeys.market.all, 'exchanges'] as const,
  },
} as const;

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate all stock-related queries
  invalidateStocks: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stocks.all });
  },
  
  // Invalidate specific stock
  invalidateStock: (symbol: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stocks.detail(symbol) });
    queryClient.invalidateQueries({ queryKey: ['stockPrices', symbol] });
  },
  
  // Invalidate stock prices
  invalidateStockPrices: (symbol?: string) => {
    if (symbol) {
      queryClient.invalidateQueries({ queryKey: ['stockPrices', symbol] });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockPrices.all });
    }
  },
  
  // Invalidate market data
  invalidateMarketData: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.market.all });
  },
  
  // Clear all cache
  clearAll: () => {
    queryClient.clear();
  },
  
  // Remove specific query from cache
  removeQuery: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Set query data manually
  setQueryData: <T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get cached query data
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
};
