import { useMemo } from 'react';
import type { UseMarketDataReturn } from '../types/FinancialContextTypes';
import { useFinancialDataContext } from '../contexts/FinancialDataContext';

/**
 * Hook for accessing market data and overall market information
 * @returns Market data, summary statistics, and market status
 */
export const useMarketData = (): UseMarketDataReturn => {
  const { state, actions } = useFinancialDataContext();

  const marketSummary = useMemo(() => {
    const allStocks = Object.values(state.stocks);
    if (allStocks.length === 0) return null;

    const totalVolume = allStocks.reduce((sum, stock) => sum + stock.volume, 0);
    const totalValue = allStocks.reduce((sum, stock) => sum + stock.currentPrice, 0);
    const averagePrice = totalValue / allStocks.length;
    const lastUpdated = Math.max(...allStocks.map(stock => stock.lastUpdated.getTime()));
    
    return {
      totalStocks: allStocks.length,
      totalVolume,
      averagePrice,
      lastUpdated,
    };
  }, [state.stocks]);

  const isMarketOpen = useMemo(() => {
    if (!state.marketData) return false;
    
    // Simple market hours check (9:30 AM - 4:00 PM EST weekdays)
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    
    // Weekend check (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) return false;
    
    // Market hours check (9:30 AM - 4:00 PM)
    return hours >= 9 && hours < 16;
  }, [state.marketData]);

  return {
    marketData: state.marketData,
    marketSummary,
    totalStocks: Object.keys(state.stocks).length,
    isMarketOpen,
    loadMarketData: actions.loadMarketData,
  };
};

/**
 * Hook for market trends and analysis
 * @returns Enhanced market analysis and trends
 */
export const useMarketTrends = () => {
  const marketDataResult = useMarketData();
  const { state } = useFinancialDataContext();

  const marketTrends = useMemo(() => {
    const allStocks = Object.values(state.stocks);
    if (allStocks.length === 0) {
      return {
        totalGainers: 0,
        totalLosers: 0,
        totalUnchanged: 0,
        averageChange: 0,
        averageChangePercent: 0,
        mostActiveByVolume: [],
        biggestGainers: [],
        biggestLosers: [],
      };
    }

    const gainers = allStocks.filter(stock => stock.change > 0);
    const losers = allStocks.filter(stock => stock.change < 0);
    const unchanged = allStocks.filter(stock => stock.change === 0);

    const totalChange = allStocks.reduce((sum, stock) => sum + stock.change, 0);
    const totalChangePercent = allStocks.reduce((sum, stock) => sum + stock.changePercent, 0);

    const averageChange = totalChange / allStocks.length;
    const averageChangePercent = totalChangePercent / allStocks.length;

    // Most active by volume (top 5)
    const mostActiveByVolume = [...allStocks]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(stock => ({ symbol: stock.symbol, volume: stock.volume }));

    // Biggest gainers (top 5)
    const biggestGainers = [...gainers]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5)
      .map(stock => ({ 
        symbol: stock.symbol, 
        change: stock.change, 
        changePercent: stock.changePercent 
      }));

    // Biggest losers (top 5)
    const biggestLosers = [...losers]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5)
      .map(stock => ({ 
        symbol: stock.symbol, 
        change: stock.change, 
        changePercent: stock.changePercent 
      }));

    return {
      totalGainers: gainers.length,
      totalLosers: losers.length,
      totalUnchanged: unchanged.length,
      averageChange,
      averageChangePercent,
      mostActiveByVolume,
      biggestGainers,
      biggestLosers,
    };
  }, [state.stocks]);

  const marketSentiment = useMemo(() => {
    if (marketTrends.totalGainers + marketTrends.totalLosers === 0) {
      return 'neutral';
    }

    const gainersRatio = marketTrends.totalGainers / (marketTrends.totalGainers + marketTrends.totalLosers);
    
    if (gainersRatio > 0.6) return 'bullish';
    if (gainersRatio < 0.4) return 'bearish';
    return 'neutral';
  }, [marketTrends.totalGainers, marketTrends.totalLosers]);

  return {
    ...marketDataResult,
    trends: marketTrends,
    sentiment: marketSentiment,
  };
};
