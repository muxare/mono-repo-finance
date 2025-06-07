import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { 
  FinancialDataContextValue, 
  FinancialDataState,
  FinancialDataActions
} from '../types/FinancialContextTypes';
import type { Timeframe, StockData } from '../types/FinancialTypes';
import { financialDataReducer, initialFinancialDataState } from './financialDataReducer';

const FinancialDataContext = createContext<FinancialDataContextValue | undefined>(undefined);

interface FinancialDataProviderProps {
  children: React.ReactNode;
}

export const FinancialDataProvider: React.FC<FinancialDataProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(financialDataReducer, initialFinancialDataState);

  // Mock API service - this will be replaced with actual API calls in Story 2.1.2
  const mockApiService = {
    async getStockData(symbol: string): Promise<StockData> {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      const mockData: StockData = {
        symbol,
        name: `${symbol} Inc.`,
        currentPrice: Math.random() * 100 + 50,
        priceHistory: Array.from({ length: 30 }, (_, i) => ({
          timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
          open: Math.random() * 100 + 50,
          high: Math.random() * 100 + 60,
          low: Math.random() * 100 + 40,
          close: Math.random() * 100 + 50,
          volume: Math.floor(Math.random() * 1000000),
        })),
        volume: Math.floor(Math.random() * 1000000),
        lastUpdated: new Date(),
        change: Math.random() * 10 - 5,
        changePercent: Math.random() * 10 - 5,
        marketCap: Math.random() * 1000000000,
        peRatio: Math.random() * 30 + 5,
        dividendYield: Math.random() * 5,
      };
      
      return mockData;
    },

    async getMultipleStocks(symbols: string[]): Promise<Record<string, StockData>> {
      const results: Record<string, StockData> = {};
      for (const symbol of symbols) {
        results[symbol] = await this.getStockData(symbol);
      }
      return results;
    }
  };

  // Check if data is stale and needs refresh
  const isDataStale = useCallback((symbol: string): boolean => {
    const lastFetch = state.cache.lastFetch[symbol];
    if (!lastFetch) return true;
    
    const now = new Date().getTime();
    const lastFetchTime = lastFetch.getTime();
    return (now - lastFetchTime) > state.cache.ttl;
  }, [state.cache.lastFetch, state.cache.ttl]);

  // Action creators
  const loadStock = useCallback(async (symbol: string, timeframe?: Timeframe) => {
    // Skip if data is fresh and no timeframe change
    if (!isDataStale(symbol) && (!timeframe || timeframe === state.timeframe)) {
      return;
    }

    dispatch({ type: 'LOAD_STOCK_START', payload: { symbol } });

    try {
      const stockData = await mockApiService.getStockData(symbol);
      dispatch({ 
        type: 'LOAD_STOCK_SUCCESS', 
        payload: { symbol, data: stockData } 
      });

      // Update timeframe if provided
      if (timeframe && timeframe !== state.timeframe) {
        dispatch({ type: 'SET_TIMEFRAME', payload: timeframe });
      }
    } catch (error) {
      dispatch({ 
        type: 'LOAD_STOCK_ERROR', 
        payload: { 
          symbol, 
          error: error instanceof Error ? error.message : 'Failed to load stock data' 
        } 
      });
    }
  }, [isDataStale, state.timeframe]);

  const loadMultipleStocks = useCallback(async (symbols: string[], timeframe?: Timeframe) => {
    dispatch({ type: 'LOAD_MULTIPLE_STOCKS_START', payload: { symbols } });

    try {
      const stocksData = await mockApiService.getMultipleStocks(symbols);
      dispatch({ 
        type: 'LOAD_MULTIPLE_STOCKS_SUCCESS', 
        payload: { stocks: stocksData } 
      });

      // Update timeframe if provided
      if (timeframe && timeframe !== state.timeframe) {
        dispatch({ type: 'SET_TIMEFRAME', payload: timeframe });
      }
    } catch (error) {
      dispatch({ 
        type: 'LOAD_MULTIPLE_STOCKS_ERROR', 
        payload: { 
          error: error instanceof Error ? error.message : 'Failed to load multiple stocks' 
        } 
      });
    }
  }, [state.timeframe]);

  const setSelectedSymbol = useCallback((symbol: string) => {
    dispatch({ type: 'SET_SELECTED_SYMBOL', payload: symbol });
  }, []);

  const setTimeframe = useCallback((timeframe: Timeframe) => {
    dispatch({ type: 'SET_TIMEFRAME', payload: timeframe });
  }, []);

  const addToWatchlist = useCallback((symbol: string) => {
    dispatch({ type: 'ADD_TO_WATCHLIST', payload: symbol });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: symbol });
  }, []);

  const updatePreferences = useCallback((preferences: Partial<FinancialDataState['preferences']>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const refreshStock = useCallback(async (symbol: string) => {
    await loadStock(symbol, state.timeframe);
  }, [loadStock, state.timeframe]);

  const refreshWatchlist = useCallback(async () => {
    if (state.watchlist.length > 0) {
      await loadMultipleStocks(state.watchlist, state.timeframe);
    }
  }, [loadMultipleStocks, state.watchlist, state.timeframe]);

  const loadMarketData = useCallback(async () => {
    try {
      // Mock market data - replace with actual API call
      const marketData = {
        indices: {
          sp500: 4500 + Math.random() * 100,
          nasdaq: 15000 + Math.random() * 500,
          dow: 35000 + Math.random() * 1000,
        },
        marketStatus: 'open' as const,
        lastUpdated: new Date(),
      };

      dispatch({ type: 'LOAD_MARKET_DATA_SUCCESS', payload: marketData });
    } catch (error) {
      dispatch({ 
        type: 'LOAD_MARKET_DATA_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load market data' 
      });
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (state.preferences.autoRefresh && state.watchlist.length > 0) {
      const interval = setInterval(() => {
        refreshWatchlist();
      }, state.preferences.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [state.preferences.autoRefresh, state.preferences.refreshInterval, state.watchlist.length, refreshWatchlist]);

  // Load market data on mount
  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  const actions: FinancialDataActions = {
    loadStock,
    loadMultipleStocks,
    setSelectedSymbol,
    setTimeframe,
    addToWatchlist,
    removeFromWatchlist,
    updatePreferences,
    clearErrors,
    refreshStock,
    refreshWatchlist,
    loadMarketData,
  };

  const contextValue: FinancialDataContextValue = {
    state,
    actions,
  };

  return (
    <FinancialDataContext.Provider value={contextValue}>
      {children}
    </FinancialDataContext.Provider>
  );
};

// Custom hook to use the Financial Data Context
export const useFinancialDataContext = (): FinancialDataContextValue => {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialDataContext must be used within a FinancialDataProvider');
  }
  return context;
};
