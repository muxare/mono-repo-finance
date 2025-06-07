import { useMemo, useCallback } from 'react';
import type { UseWatchlistReturn } from '../types/FinancialContextTypes';
import { useFinancialDataContext } from '../contexts/FinancialDataContext';

/**
 * Hook for managing watchlist functionality
 * @returns Watchlist data, actions, and utility functions
 */
export const useWatchlist = (): UseWatchlistReturn => {
  const { state, actions } = useFinancialDataContext();

  const watchlistData = useMemo(() => {
    return state.watchlist.map(symbol => ({
      symbol,
      data: state.stocks[symbol],
      isLoading: state.loading.stocks[symbol] || false,
      error: state.errors.stocks[symbol] || null,
    }));
  }, [state.watchlist, state.stocks, state.loading.stocks, state.errors.stocks]);

  const isInWatchlist = useCallback((symbol: string) => {
    return state.watchlist.includes(symbol);
  }, [state.watchlist]);

  return {
    watchlist: state.watchlist,
    watchlistData,
    addToWatchlist: actions.addToWatchlist,
    removeFromWatchlist: actions.removeFromWatchlist,
    refreshWatchlist: actions.refreshWatchlist,
    isInWatchlist,
  };
};

/**
 * Hook for watchlist with enhanced functionality
 * @returns Extended watchlist functionality with statistics and filtering
 */
export const useWatchlistEnhanced = () => {
  const watchlistResult = useWatchlist();
  const { state } = useFinancialDataContext();

  const watchlistStats = useMemo(() => {
    const validStocks = watchlistResult.watchlistData.filter(item => item.data);
    
    if (validStocks.length === 0) {
      return {
        totalStocks: 0,
        totalValue: 0,
        totalChange: 0,
        totalChangePercent: 0,
        gainers: 0,
        losers: 0,
        unchanged: 0,
      };
    }

    const totalValue = validStocks.reduce((sum, item) => {
      return sum + (item.data?.currentPrice || 0);
    }, 0);

    const totalChange = validStocks.reduce((sum, item) => {
      return sum + (item.data?.change || 0);
    }, 0);

    const gainers = validStocks.filter(item => (item.data?.change || 0) > 0).length;
    const losers = validStocks.filter(item => (item.data?.change || 0) < 0).length;
    const unchanged = validStocks.filter(item => (item.data?.change || 0) === 0).length;

    return {
      totalStocks: validStocks.length,
      totalValue,
      totalChange,
      totalChangePercent: totalValue > 0 ? (totalChange / totalValue) * 100 : 0,
      gainers,
      losers,
      unchanged,
    };
  }, [watchlistResult.watchlistData]);

  const sortedWatchlist = useMemo(() => {
    return [...watchlistResult.watchlistData].sort((a, b) => {
      // Sort by symbol alphabetically by default
      return a.symbol.localeCompare(b.symbol);
    });
  }, [watchlistResult.watchlistData]);

  const topPerformers = useMemo(() => {
    return [...watchlistResult.watchlistData]
      .filter(item => item.data)
      .sort((a, b) => (b.data?.changePercent || 0) - (a.data?.changePercent || 0))
      .slice(0, 3);
  }, [watchlistResult.watchlistData]);

  const worstPerformers = useMemo(() => {
    return [...watchlistResult.watchlistData]
      .filter(item => item.data)
      .sort((a, b) => (a.data?.changePercent || 0) - (b.data?.changePercent || 0))
      .slice(0, 3);
  }, [watchlistResult.watchlistData]);

  return {
    ...watchlistResult,
    stats: watchlistStats,
    sortedWatchlist,
    topPerformers,
    worstPerformers,
    isEmpty: state.watchlist.length === 0,
    hasData: watchlistResult.watchlistData.some(item => item.data),
  };
};
