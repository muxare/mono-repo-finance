import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CandlestickChart } from '../components/Chart';
import { CompanySelector } from './UI/CompanySelector';
import { DataFlowStatus } from './UI/DataFlowStatus';
import { ChartControls } from './UI/ChartControls';
import { PerformanceMonitor } from './UI/PerformanceMonitor';
import { useStockDataWithStatus } from '../hooks/useStockDataWithStatus';
import type { Timeframe, IndicatorConfig } from '../types/ApiTypes';

/**
 * Enhanced demo component for testing the CandlestickChart component
 * Story 2.4: Data Flow Visualization & User Interface Refinement
 */
export const CandlestickChartDemo: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [showVolume, setShowVolume] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Chart interaction state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Use enhanced hook for data flow visualization
  const { stockData, isLoading, error, status, refreshData, loadStock } = useStockDataWithStatus(selectedSymbol);
  
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

  // Chart control handlers
  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
  }, []);

  const handleTimeframeChange = useCallback((newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
    if (selectedSymbol) {
      loadStock(newTimeframe);
    }
  }, [selectedSymbol, loadStock]);

  // Chart interaction handlers
  const handleZoomIn = useCallback(() => {
    if (zoomLevel < 10) {
      const newZoom = Math.min(10, zoomLevel * 1.5);
      setZoomLevel(newZoom);
      setCanZoomIn(newZoom < 10);
      setCanZoomOut(newZoom > 1);
    }
  }, [zoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (zoomLevel > 1) {
      const newZoom = Math.max(1, zoomLevel / 1.5);
      setZoomLevel(newZoom);
      setCanZoomIn(newZoom < 10);
      setCanZoomOut(newZoom > 1);
    }
  }, [zoomLevel]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setCanZoomIn(true);
    setCanZoomOut(false);
  }, []);

  const handleFitToData = useCallback(() => {
    // Reset zoom and fit to available data range
    handleResetZoom();
  }, [handleResetZoom]);

  const handlePanLeft = useCallback(() => {
    // Simulate pan left action
    console.log('Pan left');
  }, []);

  const handlePanRight = useCallback(() => {
    // Simulate pan right action
    console.log('Pan right');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault();
            handleZoomIn();
            break;
          case '-':
            event.preventDefault();
            handleZoomOut();
            break;
          case '0':
            event.preventDefault();
            handleResetZoom();
            break;
        }
      } else {
        switch (event.key) {
          case 'ArrowLeft':
            if (event.target === document.body || event.target === chartContainerRef.current) {
              event.preventDefault();
              handlePanLeft();
            }
            break;
          case 'ArrowRight':
            if (event.target === document.body || event.target === chartContainerRef.current) {
              event.preventDefault();
              handlePanRight();
            }
            break;
          case 'f':
          case 'F':
            if (event.target === document.body || event.target === chartContainerRef.current) {
              event.preventDefault();
              handleFitToData();
            }
            break;
          case 'v':
          case 'V':
            if (event.target === document.body || event.target === chartContainerRef.current) {
              event.preventDefault();
              setShowVolume(prev => !prev);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom, handleFitToData, handlePanLeft, handlePanRight]);
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: theme === 'light' ? '#ffffff' : '#0f172a'
    }}>
      <h1 style={{ 
        color: theme === 'light' ? '#1f2937' : '#f8fafc',
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        margin: '0 0 24px 0'
      }}>
        Interactive Financial Chart
      </h1>
      
      {/* Header with Data Flow Status */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        <DataFlowStatus 
          status={status}
          isLoading={isLoading}
          error={error}
          onRefresh={refreshData}
        />
      </div>      {/* Main Controls */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px', 
        marginBottom: '20px',
        alignItems: 'start',
      }}>
        {/* Company Selector */}
        <CompanySelector
          selectedSymbol={selectedSymbol}
          onSymbolChange={handleSymbolChange}
          disabled={isLoading}
        />

        {/* Timeframe and Options */}
        <div style={{ 
          display: 'flex', 
          gap: '20px',
          padding: '16px',
          background: theme === 'light' ? '#f5f5f5' : '#2a2a2a',
          borderRadius: '8px',
          flexWrap: 'wrap',
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Timeframe:
            </label>
            <select
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value as Timeframe)}
              disabled={isLoading}
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
          </div>          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Display Options:
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <div style={{ 
                fontSize: '12px', 
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                marginLeft: '8px'
              }}>
                Zoom: {zoomLevel.toFixed(1)}x
              </div>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div style={{ 
          padding: '16px',
          background: theme === 'light' ? '#f5f5f5' : '#2a2a2a',
          borderRadius: '8px',
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Quick Actions:
            </label>
            <button
              onClick={refreshData}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        tabIndex={0}
        style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px',
          background: theme === 'light' ? '#fff' : '#1a1a1a',
          overflow: 'hidden',
          outline: 'none',
        }}
        onFocus={() => {
          // Chart container is focused, enable keyboard controls
        }}
      >{/* Chart Controls */}
        <div style={{ 
          padding: '12px',
          borderBottom: '1px solid #e0e0e0',
          background: theme === 'light' ? '#f8fafc' : '#1e293b',
        }}>
          <ChartControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onFitToData={handleFitToData}
            onPanLeft={handlePanLeft}
            onPanRight={handlePanRight}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            isLoading={isLoading}
            showVolumeToggle={true}
            showVolume={showVolume}
            onToggleVolume={setShowVolume}
          />
        </div>{/* Chart */}
        {error ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: theme === 'light' ? '#dc2626' : '#ef4444' 
          }}>
            <h3>Error Loading Chart Data</h3>
            <p>{error}</p>
            <button
              onClick={refreshData}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '12px',
              }}
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            color: theme === 'light' ? '#6b7280' : '#9ca3af'
          }}>
            <h3>Loading Chart Data...</h3>
            <p>Fetching data for {selectedSymbol}</p>
          </div>
        ) : stockData?.priceHistory ? (
          <CandlestickChart
            symbol={selectedSymbol}
            timeframe={timeframe}
            height={500}
            showVolume={showVolume}
            indicators={indicators}
            theme={theme}
            className="demo-chart"
          />
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            color: theme === 'light' ? '#6b7280' : '#9ca3af'
          }}>
            <h3>No Data Available</h3>
            <p>No chart data available for {selectedSymbol}</p>
            <button
              onClick={refreshData}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '12px',
              }}
            >
              Load Data
            </button>
          </div>
        )}
      </div>      {/* Enhanced Info Section */}
      <div style={{ 
        marginTop: '20px', 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        <div style={{ 
          padding: '16px',
          background: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
          borderRadius: '8px',
          fontSize: '14px',
          color: theme === 'light' ? '#666' : '#ccc',
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Chart Features</h3>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>🔍 Interactive zoom with mouse wheel and controls</li>
            <li>👆 Pan with click-drag or arrow keys</li>
            <li>🎯 Crosshair tooltip with price information</li>
            <li>📊 Volume overlay with color-coded bars</li>
            <li>📈 Technical indicators (SMA, EMA, etc.)</li>
            <li>🌙 Light and dark theme support</li>
            <li>✨ Smooth D3.js animations</li>
            <li>📱 Mobile-responsive touch gestures</li>
          </ul>
        </div>

        <div style={{ 
          padding: '16px',
          background: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
          borderRadius: '8px',
          fontSize: '14px',
          color: theme === 'light' ? '#666' : '#ccc',
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Keyboard Controls</h3>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li><kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> - Zoom in/out</li>
            <li><kbd>Ctrl</kbd> + <kbd>0</kbd> - Reset zoom</li>
            <li><kbd>←</kbd> / <kbd>→</kbd> - Pan left/right</li>
            <li><kbd>F</kbd> - Fit chart to data</li>
            <li><kbd>V</kbd> - Toggle volume display</li>
            <li><kbd>Esc</kbd> - Close dropdowns</li>
          </ul>
          
          <h4 style={{ margin: '12px 0 4px 0' }}>Mouse Controls</h4>          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>🖱️ <strong>Wheel</strong> - Zoom in/out</li>
            <li>🖱️ <strong>Drag</strong> - Pan chart</li>
            <li>🖱️ <strong>Hover</strong> - Show crosshair</li>
          </ul>
          
          <h4 style={{ margin: '12px 0 4px 0' }}>Accessibility</h4>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>🔤 Full keyboard navigation</li>
            <li>📱 Touch gesture support</li>
            <li>📊 <kbd>Ctrl</kbd> + <kbd>P</kbd> - Performance monitor</li>
            <li>🔄 Tab through all interactive elements</li>
          </ul>
        </div>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor
        isLoading={isLoading}
        dataTimestamp={status.lastUpdate}
      />
    </div>
  );
};

export default CandlestickChartDemo;
