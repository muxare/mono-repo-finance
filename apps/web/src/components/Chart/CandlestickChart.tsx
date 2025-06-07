import React, { useMemo } from 'react';
import { useCandlestickChart } from '../../hooks/useCandlestickChart';
import { useChartDimensions } from '../../hooks/useChartDimensions';
import { useStockData } from '../../hooks/useStockData';
import type { 
  BaseCandlestickChartProps, 
  D3ChartConfig,
  Timeframe,
  OHLCV 
} from '../../types/ChartTypes';
import { DEFAULT_CHART_DIMENSIONS, DEFAULT_TIMEFRAME } from '../../types/ChartTypes';
import './CandlestickChart.css';

export interface CandlestickChartProps extends BaseCandlestickChartProps {
  onCrosshairMove?: (data: any) => void;
  onZoom?: (transform: { x: number; y: number; k: number }) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  timeframe = DEFAULT_TIMEFRAME,
  height = DEFAULT_CHART_DIMENSIONS.height,
  showVolume = true,
  indicators = [],
  theme = 'light',
  className = '',
  // onCrosshairMove, // TODO: Implement crosshair move callback
  // onZoom, // TODO: Implement zoom callback  
  // onTimeframeChange, // TODO: Implement timeframe change callback
}) => {
  // Get data from Context API
  const { stockData, isLoading, error } = useStockData(symbol);
  
  // Chart dimensions with responsive behavior
  const { containerRef, dimensions } = useChartDimensions({
    height,
    margin: { top: 20, right: 60, bottom: 40, left: 60 },
  });  // Prepare chart configuration
  const chartConfig = useMemo((): D3ChartConfig => {
    // Convert FinancialTypes OHLCV to ChartTypes OHLCV format
    const convertedData: OHLCV[] = (stockData?.priceHistory || []).map(item => ({
      time: Math.floor(item.timestamp.getTime() / 1000), // Convert to Unix timestamp
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    return {
      data: convertedData,
      dimensions,
      timeframe,
      showVolume,
      indicators: indicators.map(indicator => ({
        ...indicator,
        data: [], // TODO: Add indicator data support once technical indicators are implemented
      })),
      theme,
    };
  }, [stockData, dimensions, timeframe, showVolume, indicators, theme]);
  // Initialize D3 chart
  const { svgRef, fitToData, resetZoom } = useCandlestickChart(chartConfig);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className={`candlestick-chart ${className} loading`} style={{ height }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`candlestick-chart ${className} error`} style={{ height }}>
        <div className="error-message">
          <h4>Error loading chart data</h4>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stockData?.priceHistory?.length) {
    return (
      <div className={`candlestick-chart ${className} no-data`} style={{ height }}>
        <div className="no-data-message">
          <h4>No chart data available</h4>
          <p>No historical data found for {symbol}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`candlestick-chart ${className} ${theme}`}
      style={{ height }}
    >
      {/* Chart Header */}
      <div className="chart-header">
        <div className="chart-title">
          <h3>{symbol} - {timeframe}</h3>
          <div className="price-info">
            <span className="current-price">
              ${stockData.currentPrice?.toFixed(2) || 'N/A'}
            </span>
            <span className={`price-change ${(stockData.change || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stockData.change || 0) >= 0 ? '+' : ''}{(stockData.change || 0).toFixed(2)} 
              ({(stockData.changePercent || 0).toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="chart-controls">
          <button 
            onClick={fitToData}
            className="chart-btn"
            title="Fit to data"
          >
            🔍
          </button>
          <button 
            onClick={resetZoom}
            className="chart-btn"
            title="Reset zoom"
          >
            ↻
          </button>
        </div>
      </div>

      {/* D3.js SVG Chart */}
      <div className="chart-container">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="d3-candlestick-chart"
        />
      </div>

      {/* Chart Footer */}
      <div className="chart-footer">
        <div className="chart-info">
          <span className="data-points">
            {stockData.priceHistory.length} data points
          </span>
          <span className="last-updated">
            Updated: {stockData.lastUpdated ? new Date(stockData.lastUpdated).toLocaleString() : 'Unknown'}
          </span>
        </div>
        
        {/* Indicator Legend */}
        {indicators.length > 0 && (
          <div className="indicator-legend">
            {indicators.map((indicator, index) => (
              <div 
                key={`${indicator.type}-${index}`}
                className={`indicator-item ${indicator.visible ? 'visible' : 'hidden'}`}
              >
                <div 
                  className="indicator-color" 
                  style={{ backgroundColor: indicator.color || '#2196F3' }}
                />
                <span className="indicator-name">{indicator.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandlestickChart;
