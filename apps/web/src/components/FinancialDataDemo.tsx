import React, { useState } from 'react';
import { 
  useStockData, 
  useWatchlist, 
  useMarketData, 
  usePreferences,
  useTimeframe 
} from '../hooks';

/**
 * Demo component showing how to use the Financial Data Context
 * This component demonstrates all the major hooks and their functionality
 */
export const FinancialDataDemo: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  
  // Stock data hooks
  const { stockData, isLoading, error, loadStock } = useStockData(symbol);
  
  // Watchlist hooks
  const { 
    watchlist, 
    watchlistData, 
    addToWatchlist, 
    removeFromWatchlist,
    refreshWatchlist 
  } = useWatchlist();
  
  // Market data hooks
  const { marketData, marketSummary, isMarketOpen } = useMarketData();
  
  // Preferences hooks
  const { preferences, updateTheme, updateAutoRefresh } = usePreferences();
  
  // Timeframe hooks
  const { 
    currentTimeframe, 
    availableTimeframes, 
    setTimeframe 
  } = useTimeframe();

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value.toUpperCase());
  };

  const handleLoadStock = () => {
    loadStock(currentTimeframe);
  };

  const isInWatchlist = watchlist.includes(symbol);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Financial Data Context Demo</h1>
      
      {/* Market Status */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Market Status</h2>
        <p>Market is {isMarketOpen ? 'OPEN' : 'CLOSED'}</p>
        {marketData && (
          <div>
            <p>S&P 500: {marketData.indices.sp500.toFixed(2)}</p>
            <p>NASDAQ: {marketData.indices.nasdaq.toFixed(2)}</p>
            <p>DOW: {marketData.indices.dow.toFixed(2)}</p>
          </div>
        )}
        {marketSummary && (
          <div>
            <p>Total Stocks Loaded: {marketSummary.totalStocks}</p>
            <p>Average Price: ${marketSummary.averagePrice.toFixed(2)}</p>
          </div>
        )}
      </section>

      {/* Stock Data Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Stock Data</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={symbol}
            onChange={handleSymbolChange}
            placeholder="Enter stock symbol"
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleLoadStock} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load Stock'}
          </button>
          <button 
            onClick={() => isInWatchlist ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
            style={{ marginLeft: '10px' }}
          >
            {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            Error: {error}
          </div>
        )}

        {stockData && (
          <div>
            <h3>{stockData.name} ({stockData.symbol})</h3>
            <p>Current Price: ${stockData.currentPrice.toFixed(2)}</p>
            <p>Change: {stockData.change >= 0 ? '+' : ''}${stockData.change.toFixed(2)} 
               ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)</p>
            <p>Volume: {stockData.volume.toLocaleString()}</p>
            <p>Market Cap: ${(stockData.marketCap || 0).toLocaleString()}</p>
            <p>Last Updated: {stockData.lastUpdated.toLocaleString()}</p>
          </div>
        )}
      </section>

      {/* Timeframe Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Timeframe</h2>
        <p>Current: {currentTimeframe}</p>
        <div>
          {availableTimeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                marginRight: '10px',
                backgroundColor: tf === currentTimeframe ? '#007bff' : '#f8f9fa',
                color: tf === currentTimeframe ? 'white' : 'black',
                border: '1px solid #ccc',
                padding: '5px 10px'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </section>

      {/* Watchlist Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Watchlist ({watchlist.length} stocks)</h2>
        <button onClick={refreshWatchlist} style={{ marginBottom: '15px' }}>
          Refresh Watchlist
        </button>
        
        {watchlistData.length === 0 ? (
          <p>No stocks in watchlist</p>
        ) : (
          <div>
            {watchlistData.map(item => (
              <div key={item.symbol} style={{ 
                marginBottom: '10px', 
                padding: '10px', 
                border: '1px solid #eee' 
              }}>
                <strong>{item.symbol}</strong>
                {item.isLoading && <span> (Loading...)</span>}
                {item.error && <span style={{ color: 'red' }}> Error: {item.error}</span>}
                {item.data && (
                  <div>
                    <span> ${item.data.currentPrice.toFixed(2)} </span>
                    <span style={{ 
                      color: item.data.change >= 0 ? 'green' : 'red' 
                    }}>
                      {item.data.change >= 0 ? '+' : ''}${item.data.change.toFixed(2)} 
                      ({item.data.changePercent >= 0 ? '+' : ''}{item.data.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => removeFromWatchlist(item.symbol)}
                  style={{ marginTop: '5px', fontSize: '12px' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Preferences Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Preferences</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Theme: 
            <select 
              value={preferences.theme} 
              onChange={(e) => updateTheme(e.target.value as 'light' | 'dark')}
              style={{ marginLeft: '10px' }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={preferences.autoRefresh}
              onChange={(e) => updateAutoRefresh(e.target.checked)}
            />
            Auto Refresh ({preferences.refreshInterval / 1000}s interval)
          </label>
        </div>
        
        <div>
          <p>Default Timeframe: {preferences.defaultTimeframe}</p>
        </div>
      </section>
    </div>
  );
};
