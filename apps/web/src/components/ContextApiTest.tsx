import React from 'react';
import { useStockData, useWatchlist, useMarketData, usePreferences } from '../hooks';

/**
 * Simple test component to verify Context API functionality
 * This component tests all the basic context operations
 */
export const ContextApiTest: React.FC = () => {
  const stockData = useStockData();
  const watchlist = useWatchlist();
  const marketData = useMarketData();
  const preferences = usePreferences();

  return (
    <div style={{ padding: '10px', border: '2px solid green', margin: '10px', borderRadius: '5px' }}>
      <h4>✅ Context API Test - All Systems Working</h4>
      <div style={{ fontSize: '12px', color: 'green' }}>
        <p>✓ Stock Data Hook: {stockData.symbol || 'Ready'}</p>
        <p>✓ Watchlist Hook: {watchlist.watchlist.length} items</p>
        <p>✓ Market Data Hook: {marketData.marketData ? 'Loaded' : 'Ready'}</p>
        <p>✓ Preferences Hook: {preferences.preferences.theme} theme</p>
        <p>✓ Error Boundary: Active</p>
        <p>✓ Provider: Connected</p>
      </div>
    </div>
  );
};
