import React, { useState } from 'react';
import { CandlestickChart } from '../components/Chart';
import type { Timeframe, IndicatorConfig } from '../types/ApiTypes';

/**
 * Demo component for testing the CandlestickChart component
 * Story 2.1.3: D3.js Candlestick Chart Component
 */
export const CandlestickChartDemo: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [showVolume, setShowVolume] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const indicators: IndicatorConfig[] = [
    {
      type: 'SMA',
      visible: true,
      color: '#2196F3',
      parameters: { period: 20 },
    },
    {
      type: 'EMA',
      visible: false,
      color: '#FF9800',
      parameters: { period: 12 },
    },
  ];

  const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Candlestick Chart Demo</h1>
      
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        padding: '16px',
        background: theme === 'light' ? '#f5f5f5' : '#2a2a2a',
        borderRadius: '8px',
        flexWrap: 'wrap',
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Symbol:
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            placeholder="Enter stock symbol"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Timeframe:
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Options:
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => setShowVolume(e.target.checked)}
              />
              Show Volume
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              />
              Dark Theme
            </label>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px',
        background: theme === 'light' ? '#fff' : '#1a1a1a',
      }}>
        <CandlestickChart
          symbol={symbol}
          timeframe={timeframe}
          height={500}
          showVolume={showVolume}
          indicators={indicators}
          theme={theme}
          className="demo-chart"
        />
      </div>

      {/* Info */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px',
        background: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
        borderRadius: '8px',
        fontSize: '14px',
        color: theme === 'light' ? '#666' : '#ccc',
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Chart Features</h3>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Interactive zoom and pan with mouse wheel and drag</li>
          <li>Crosshair tooltip showing price and time information</li>
          <li>Responsive design that adapts to container size</li>
          <li>Volume overlay with color-coded bars</li>
          <li>Support for technical indicators (SMA, EMA, etc.)</li>
          <li>Light and dark theme support</li>
          <li>Smooth D3.js animations and transitions</li>
        </ul>
      </div>
    </div>
  );
};

export default CandlestickChartDemo;
