/**
 * Financial Data Context Hooks
 * 
 * This module exports all the custom hooks for consuming financial data context.
 * These hooks provide a clean, type-safe API for accessing and manipulating
 * financial data throughout the application.
 */

// Chart hooks (Story 2.1.3)
export { useCandlestickChart } from './useCandlestickChart';
export { useChartDimensions } from './useChartDimensions';

// Core context hook
export { useFinancialDataContext } from '../contexts/FinancialDataContext';

// Stock data hooks
export { 
  useStockData, 
  useSelectedStock, 
  useStockDataWithAutoLoad 
} from './useStockData';

// Watchlist hooks
export { 
  useWatchlist, 
  useWatchlistEnhanced 
} from './useWatchlist';

// Market data hooks
export { 
  useMarketData, 
  useMarketTrends 
} from './useMarketData';

// Preferences and settings hooks
export { 
  usePreferences, 
  useTimeframe 
} from './usePreferences';

// Financial Query Hooks
export * from './useFinancialQuery';

// Re-export types for convenience
export type {
  FinancialDataContextValue,
  FinancialDataState,
  FinancialDataActions,
  UseStockDataReturn,
  UseWatchlistReturn,
  UseMarketDataReturn,
} from '../types/FinancialContextTypes';
