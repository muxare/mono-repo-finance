import { useMemo, useCallback, useEffect } from 'react';
import type { UseStockDataReturn } from '../types/FinancialContextTypes';
import type { Timeframe } from '../types/FinancialTypes';
import { useFinancialDataContext } from '../contexts/FinancialDataContext';

/**
 * Hook for accessing stock data for a specific symbol
 * @param symbol - Stock symbol (optional, uses selected symbol if not provided)
 * @returns Stock data, loading state, error, and actions
 */
export const useStockData = (symbol?: string): UseStockDataReturn => {
  const { state, actions } = useFinancialDataContext();
  const targetSymbol = symbol || state.selectedSymbol;

  const stockData = useMemo(() => {
    return targetSymbol ? state.stocks[targetSymbol] || null : null;
  }, [state.stocks, targetSymbol]);

  const isLoading = useMemo(() => {
    return targetSymbol ? state.loading.stocks[targetSymbol] || false : false;
  }, [state.loading.stocks, targetSymbol]);

  const error = useMemo(() => {
    return targetSymbol ? state.errors.stocks[targetSymbol] || null : null;
  }, [state.errors.stocks, targetSymbol]);

  const loadStock = useCallback(
    (timeframe?: Timeframe) => {
      if (targetSymbol) {
        return actions.loadStock(targetSymbol, timeframe);
      }
      return Promise.resolve();
    },
    [actions, targetSymbol]
  );

  return {
    stockData,
    isLoading,
    error,
    loadStock,
    symbol: targetSymbol,
  };
};

/**
 * Hook for accessing the currently selected stock
 * @returns Currently selected stock data and selection actions
 */
export const useSelectedStock = () => {
  const { state, actions } = useFinancialDataContext();
  const stockDataResult = useStockData(state.selectedSymbol || undefined);

  return {
    ...stockDataResult,
    setSelectedSymbol: actions.setSelectedSymbol,
    selectedSymbol: state.selectedSymbol,
  };
};

/**
 * Hook for managing stock data with automatic loading
 * @param symbol - Stock symbol to watch
 * @param autoLoad - Whether to automatically load data when symbol changes
 * @param timeframe - Timeframe to use for loading
 * @returns Stock data with enhanced loading management
 */
export const useStockDataWithAutoLoad = (
  symbol: string,
  autoLoad: boolean = true,
  timeframe?: Timeframe
) => {
  const { actions } = useFinancialDataContext();
  const stockDataResult = useStockData(symbol);

  // Auto-load when symbol changes or on mount
  const loadDataIfNeeded = useCallback(() => {
    if (autoLoad && symbol && !stockDataResult.stockData && !stockDataResult.isLoading) {
      actions.loadStock(symbol, timeframe);
    }
  }, [autoLoad, symbol, stockDataResult.stockData, stockDataResult.isLoading, actions, timeframe]);

  // Load data on mount or when dependencies change
  useEffect(() => {
    loadDataIfNeeded();
  }, [loadDataIfNeeded]);

  return {
    ...stockDataResult,
    refresh: () => actions.refreshStock(symbol),
    forceReload: () => actions.loadStock(symbol, timeframe),
  };
};
