import React from 'react';
import { FinancialDataProvider } from '../contexts/FinancialDataContext';
import { FinancialDataErrorBoundary } from '../components/FinancialDataErrorBoundary';
import type { FinancialDataState } from '../types/FinancialContextTypes';
import type { StockData } from '../types/FinancialTypes';

/**
 * Development and testing utilities for Financial Data Context
 * Provides helper functions and mock data for development and testing
 */

// Mock stock data generator
export const createMockStockData = (symbol: string, overrides?: Partial<StockData>): StockData => ({
  symbol,
  name: `${symbol} Inc.`,
  currentPrice: 100 + Math.random() * 50,
  priceHistory: Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    open: 95 + Math.random() * 10,
    high: 100 + Math.random() * 10,
    low: 90 + Math.random() * 10,
    close: 95 + Math.random() * 10,
    volume: Math.floor(Math.random() * 1000000),
  })),
  volume: Math.floor(Math.random() * 1000000),
  lastUpdated: new Date(),
  change: Math.random() * 10 - 5,
  changePercent: Math.random() * 10 - 5,
  marketCap: Math.random() * 1000000000,
  peRatio: Math.random() * 30 + 5,
  dividendYield: Math.random() * 5,
  ...overrides,
});

// Mock initial state generator
export const createMockFinancialState = (overrides?: Partial<FinancialDataState>): FinancialDataState => ({
  stocks: {},
  watchlist: [],
  selectedSymbol: null,
  timeframe: '1M',
  loading: {
    stocks: {},
    global: false,
  },
  errors: {
    stocks: {},
    global: null,
  },
  cache: {
    lastFetch: {},
    ttl: 5 * 60 * 1000,
  },
  preferences: {
    theme: 'light',
    defaultTimeframe: '1M',
    autoRefresh: false,
    refreshInterval: 30000,
  },
  marketData: null,
  ...overrides,
});

// Development provider with pre-populated data
interface DevFinancialDataProviderProps {
  children: React.ReactNode;
  initialStocks?: Record<string, StockData>;
  initialWatchlist?: string[];
}

export const DevFinancialDataProvider: React.FC<DevFinancialDataProviderProps> = ({
  children,
  // initialStocks = {}, // TODO: Implement pre-populated data for development
  // initialWatchlist = [], // TODO: Implement pre-populated watchlist for development
}) => {
  // For development purposes, we use the regular provider
  // but could enhance it with pre-populated data in the future
  return (
    <FinancialDataErrorBoundary>
      <FinancialDataProvider>
        {children}
      </FinancialDataProvider>
    </FinancialDataErrorBoundary>
  );
};

// Test data sets for development
export const devStockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];

export const devWatchlist = ['AAPL', 'GOOGL', 'MSFT'];

export const devStocksData = devStockSymbols.reduce((acc, symbol) => {
  acc[symbol] = createMockStockData(symbol);
  return acc;
}, {} as Record<string, StockData>);

// Performance monitoring helpers
export const measureContextPerformance = (operation: () => void, label?: string) => {
  const startTime = performance.now();
  operation();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (label) {
    console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
  }
  
  return duration;
};

export const logPerformanceWarning = (duration: number, limit: number = 16, operation?: string) => {
  if (duration > limit) {
    console.warn(
      `Performance Warning: ${operation || 'Operation'} took ${duration.toFixed(2)}ms ` +
      `(exceeds ${limit}ms limit)`
    );
  }
};

// Development localStorage mock for testing preferences
export const createDevLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
      console.log(`LocalStorage SET: ${key} = ${value}`);
    },
    removeItem: (key: string) => {
      delete store[key];
      console.log(`LocalStorage REMOVE: ${key}`);
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
      console.log('LocalStorage CLEARED');
    },
    get store() {
      return { ...store };
    },
  };
};

// Context debugging helpers
export const logContextState = (state: FinancialDataState, label?: string) => {
  const prefix = label ? `[${label}] ` : '';
  console.group(`${prefix}Financial Context State`);
  
  console.log('Stocks:', Object.keys(state.stocks).length, 'loaded');
  console.log('Watchlist:', state.watchlist);
  console.log('Selected Symbol:', state.selectedSymbol);
  console.log('Timeframe:', state.timeframe);
  console.log('Loading States:', {
    global: state.loading.global,
    stocks: Object.keys(state.loading.stocks).length
  });
  console.log('Errors:', {
    global: state.errors.global,
    stocks: Object.keys(state.errors.stocks).length
  });
  console.log('Preferences:', state.preferences);
  console.log('Market Data:', state.marketData ? 'Loaded' : 'Not loaded');
  
  console.groupEnd();
};

// Context action logging wrapper
export const createLoggingActions = (actions: any, prefix = 'ContextAction') => {
  const loggingActions: any = {};
  
  Object.keys(actions).forEach(actionName => {
    if (typeof actions[actionName] === 'function') {
      loggingActions[actionName] = (...args: any[]) => {
        console.log(`${prefix}:${actionName}`, args);
        return actions[actionName](...args);
      };
    } else {
      loggingActions[actionName] = actions[actionName];
    }
  });
  
  return loggingActions;
};

// Validation helpers
export const validateStockData = (stockData: StockData | null, symbol: string): boolean => {
  if (!stockData) {
    console.error(`Validation failed: Stock data for ${symbol} is null`);
    return false;
  }
  
  if (stockData.symbol !== symbol) {
    console.error(`Validation failed: Symbol mismatch. Expected ${symbol}, got ${stockData.symbol}`);
    return false;
  }
  
  if (stockData.currentPrice <= 0) {
    console.error(`Validation failed: Invalid current price for ${symbol}: ${stockData.currentPrice}`);
    return false;
  }
  
  if (!stockData.priceHistory || stockData.priceHistory.length === 0) {
    console.error(`Validation failed: Empty price history for ${symbol}`);
    return false;
  }
  
  console.log(`Validation passed: Stock data for ${symbol} is valid`);
  return true;
};

export const validateWatchlist = (watchlist: string[], symbols: string[]): boolean => {
  const missing = symbols.filter(symbol => !watchlist.includes(symbol));
  
  if (missing.length > 0) {
    console.error(`Validation failed: Watchlist missing symbols: ${missing.join(', ')}`);
    return false;
  }
  
  console.log(`Validation passed: Watchlist contains all expected symbols`);
  return true;
};
