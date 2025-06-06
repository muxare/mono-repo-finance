# Story 2.1.3: D3.js React Candlestick Chart Component

## 📋 Story Overview
- **Epic**: Frontend Chart Components & Visualization
- **Story ID**: 2.1.3
- **Priority**: High
- **Story Points**: 13
- **Sprint**: 3

## 🎯 User Story
**As a** trader/investor  
**I want** interactive candlestick charts built with D3.js and React following Swizec Teller's approach  
**So that** I can analyze stock price movements with high-performance, custom visualizations consuming data from the Context API and backend services

## 📝 Acceptance Criteria

### D3.js + React Integration (Swizec Teller Pattern)
- [ ] Implement React component wrapper with D3.js rendering engine
- [ ] Use React for state management and lifecycle, D3 for DOM manipulation
- [ ] Custom hooks for D3 chart logic separation (`useCandlestickChart`, `useChartDimensions`)
- [ ] TypeScript integration for type-safe D3 operations
- [ ] Responsive design with automatic resize handling using D3 scales

### Core Chart Features
- [ ] Real-time candlestick chart rendering with D3.js transitions and animations
- [ ] Interactive zoom and pan using d3-zoom with proper scale constraints
- [ ] Multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y, ALL) with smooth D3 transitions
- [ ] Volume overlay with synchronized D3 scales and color-coded bars
- [ ] Custom crosshair implementation with d3-selection and mouse tracking
- [ ] Tooltip system using D3.js positioning and React portals

### Technical Indicators Integration
- [ ] Moving Averages (SMA, EMA) overlay lines with D3 line generators
- [ ] RSI subplot with overbought/oversold threshold lines (30/70 levels)
- [ ] MACD histogram and signal lines in dedicated subplot
- [ ] Bollinger Bands with D3 area generators for band fills
- [ ] Support/Resistance level detection with horizontal lines
- [ ] All indicators pre-calculated from backend (Story 1.4) and managed via Context API (Story 2.1.1)

### Data Integration
- [ ] Consume stock data from FinancialDataContext (Story 2.1.1)
- [ ] Integrate with backend API service (Story 2.1.2) for data fetching
- [ ] Handle loading states and error conditions from context
- [ ] Support real-time data updates from WebSocket service
- [ ] Implement data transformation for D3.js consumption

### User Experience
- [ ] Responsive design for mobile and desktop with D3 viewport management
- [ ] Theme support (light/dark mode) with D3 color scales
- [ ] Loading states and error handling with React components
- [ ] Performance optimization for large datasets (1000+ data points)
- [ ] Keyboard shortcuts for common actions (zoom, pan, timeframe selection)

## 🛠️ Technical Implementation

### 1. D3.js + React Architecture (Swizec Teller Pattern)

```typescript
// hooks/useCandlestickChart.ts - Core D3 logic hook
import * as d3 from 'd3';
import { useRef, useEffect, useMemo } from 'react';

export interface ChartDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export interface D3ChartConfig {
  data: OHLCV[];
  dimensions: ChartDimensions;
  timeframe: Timeframe;
  showVolume: boolean;
  indicators: IndicatorConfig[];
  theme: 'light' | 'dark';
}

export const useCandlestickChart = (config: D3ChartConfig) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<{
    xScale?: d3.ScaleTime<number, number>;
    yScale?: d3.ScaleLinear<number, number>;
    volumeScale?: d3.ScaleLinear<number, number>;
    zoom?: d3.ZoomBehavior<SVGSVGElement, unknown>;
  }>({});

  // Create D3 scales
  const scales = useMemo(() => {
    const { width, height, margin } = config.dimensions;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Time scale for x-axis
    const xScale = d3.scaleTime()
      .domain(d3.extent(config.data, d => new Date(d.time * 1000)) as [Date, Date])
      .range([0, chartWidth]);

    // Price scale for y-axis
    const priceExtent = d3.extent(config.data.flatMap(d => [d.low, d.high])) as [number, number];
    const yScale = d3.scaleLinear()
      .domain(priceExtent)
      .range([chartHeight * 0.7, 0]) // Reserve 30% for volume
      .nice();

    // Volume scale
    const volumeExtent = d3.extent(config.data, d => d.volume || 0) as [number, number];
    const volumeScale = d3.scaleLinear()
      .domain(volumeExtent)
      .range([chartHeight, chartHeight * 0.7]); // Bottom 30%

    return { xScale, yScale, volumeScale, chartWidth, chartHeight };
  }, [config.data, config.dimensions]);

  // D3 rendering effect
  useEffect(() => {
    if (!svgRef.current || !config.data.length) return;

    const svg = d3.select(svgRef.current);
    const { xScale, yScale, volumeScale, chartWidth, chartHeight } = scales;
    const { margin } = config.dimensions;

    // Clear previous render
    svg.selectAll('*').remove();

    // Create main chart group
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw candlesticks
    const candlesticks = chartGroup.selectAll('.candlestick')
      .data(config.data)
      .enter()
      .append('g')
      .attr('class', 'candlestick');

    // Candlestick wicks (high-low lines)
    candlesticks.append('line')
      .attr('class', 'wick')
      .attr('x1', d => xScale(new Date(d.time * 1000)))
      .attr('x2', d => xScale(new Date(d.time * 1000)))
      .attr('y1', d => yScale(d.high))
      .attr('y2', d => yScale(d.low))
      .attr('stroke', d => d.close >= d.open ? '#4CAF50' : '#F44336')
      .attr('stroke-width', 1);

    // Candlestick bodies (open-close rectangles)
    const candleWidth = Math.max(1, chartWidth / config.data.length * 0.8);
    
    candlesticks.append('rect')
      .attr('class', 'candle-body')
      .attr('x', d => xScale(new Date(d.time * 1000)) - candleWidth / 2)
      .attr('y', d => yScale(Math.max(d.open, d.close)))
      .attr('width', candleWidth)
      .attr('height', d => Math.abs(yScale(d.open) - yScale(d.close)))
      .attr('fill', d => d.close >= d.open ? '#4CAF50' : '#F44336')
      .attr('stroke', d => d.close >= d.open ? '#4CAF50' : '#F44336');

    // Draw volume bars if enabled
    if (config.showVolume) {
      chartGroup.selectAll('.volume-bar')
        .data(config.data)
        .enter()
        .append('rect')
        .attr('class', 'volume-bar')
        .attr('x', d => xScale(new Date(d.time * 1000)) - candleWidth / 2)
        .attr('y', d => volumeScale(d.volume || 0))
        .attr('width', candleWidth)
        .attr('height', d => chartHeight - volumeScale(d.volume || 0))
        .attr('fill', d => d.close >= d.open ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)');
    }

    // Draw technical indicators
    config.indicators.forEach(indicator => {
      if (indicator.visible && indicator.data) {
        const line = d3.line<{time: number, value: number}>()
          .x(d => xScale(new Date(d.time * 1000)))
          .y(d => yScale(d.value))
          .curve(d3.curveMonotoneX);

        chartGroup.append('path')
          .datum(indicator.data)
          .attr('class', `indicator indicator-${indicator.type.toLowerCase()}`)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', indicator.color || '#2196F3')
          .attr('stroke-width', 2);
      }
    });

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%m/%d'));
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.2f'));

    chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis);

    chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Add zoom and pan behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        const transform = event.transform;
        
        // Update scales with transform
        const newXScale = transform.rescaleX(xScale);
        
        // Re-render with new scales
        chartGroup.selectAll('.candlestick')
          .attr('transform', d => `translate(${transform.x},0) scale(${transform.k},1)`);
        
        // Update x-axis
        chartGroup.select('.x-axis')
          .call(d3.axisBottom(newXScale).tickFormat(d3.timeFormat('%m/%d')));
      });

    svg.call(zoom);
    chartRef.current.zoom = zoom;

  }, [config, scales]);

  // Chart interaction methods
  const fitToData = () => {
    if (chartRef.current.zoom && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(chartRef.current.zoom.transform, d3.zoomIdentity);
    }
  };

  const zoomToTimeRange = (startTime: Date, endTime: Date) => {
    if (!chartRef.current.zoom || !svgRef.current) return;
    
    const { xScale } = scales;
    const { width, margin } = config.dimensions;
    const chartWidth = width - margin.left - margin.right;
    
    const x0 = xScale(startTime);
    const x1 = xScale(endTime);
    const scale = chartWidth / (x1 - x0);
    const translate = -x0 * scale;
    
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(chartRef.current.zoom.transform, d3.zoomIdentity.scale(scale).translate(translate, 0));
  };

  return {
    svgRef,
    scales,
    fitToData,
    zoomToTimeRange,
  };
};
```

### 2. Chart Component Implementation

```typescript
// components/Chart/CandlestickChart.tsx
import React, { useMemo } from 'react';
import { useCandlestickChart } from '../../hooks/useCandlestickChart';
import { useChartDimensions } from '../../hooks/useChartDimensions';
import { useStockData } from '../../hooks/useStockData';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { ErrorMessage } from '../UI/ErrorMessage';
import './CandlestickChart.css';

export interface CandlestickChartProps {
  symbol: string;
  timeframe: Timeframe;
  height?: number;
  showVolume?: boolean;
  indicators?: IndicatorConfig[];
  theme?: 'light' | 'dark';
  className?: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  timeframe,
  height = 500,
  showVolume = true,
  indicators = [],
  theme = 'light',
  className = '',
}) => {
  // Get data from Context API
  const { stockData, isLoading, error } = useStockData(symbol);
  
  // Chart dimensions with responsive behavior
  const { containerRef, dimensions } = useChartDimensions({
    height,
    margin: { top: 20, right: 60, bottom: 40, left: 60 },
  });

  // Prepare chart configuration
  const chartConfig = useMemo(() => ({
    data: stockData?.priceHistory || [],
    dimensions,
    timeframe,
    showVolume,
    indicators: indicators.map(indicator => ({
      ...indicator,
      data: stockData?.indicators?.[indicator.type.toLowerCase()],
    })),
    theme,
  }), [stockData, dimensions, timeframe, showVolume, indicators, theme]);

  // Initialize D3 chart
  const { svgRef, fitToData, zoomToTimeRange } = useCandlestickChart(chartConfig);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className={`candlestick-chart ${className} loading`} style={{ height }}>
        <LoadingSpinner message="Loading chart data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`candlestick-chart ${className} error`} style={{ height }}>
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  if (!stockData?.priceHistory?.length) {
    return (
      <div className={`candlestick-chart ${className} no-data`} style={{ height }}>
        <div className="no-data-message">
          No chart data available for {symbol}
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
              ${stockData.currentPrice.toFixed(2)}
            </span>
            <span className={`price-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
              {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} 
              ({stockData.changePercent.toFixed(2)}%)
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
        </div>
      </div>

      {/* D3.js SVG Chart */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="d3-candlestick-chart"
      />

      {/* Chart Footer */}
      <div className="chart-footer">
        <div className="chart-info">
          <span className="data-points">
            {stockData.priceHistory.length} data points
          </span>
          <span className="last-updated">
            Updated: {new Date(stockData.lastUpdated).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
```

### 3. Custom Hooks for D3 Integration

```typescript
// hooks/useChartDimensions.ts
import { useRef, useState, useEffect } from 'react';

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface UseChartDimensionsConfig {
  height: number;
  margin: ChartMargin;
}

export const useChartDimensions = (config: UseChartDimensionsConfig) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: config.height,
    margin: config.margin,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions(prev => ({
          ...prev,
          width: Math.max(300, width), // Minimum width
        }));
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up ResizeObserver for responsive behavior
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Fallback resize listener
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return { containerRef, dimensions };
};
```

### 4. Chart Styling with CSS

```css
/* components/Chart/CandlestickChart.css */
.candlestick-chart {
  position: relative;
  background: var(--chart-background, #ffffff);
  border: 1px solid var(--chart-border, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.candlestick-chart.dark {
  --chart-background: #1a1a1a;
  --chart-border: #333333;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
}

.candlestick-chart.light {
  --chart-background: #ffffff;
  --chart-border: #e0e0e0;
  --text-primary: #333333;
  --text-secondary: #666666;
}

/* Chart Header */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--chart-border);
  background: var(--chart-background);
}

.chart-title h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.price-info {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 4px;
}

.current-price {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.price-change {
  font-size: 14px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
}

.price-change.positive {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.price-change.negative {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.chart-controls {
  display: flex;
  gap: 8px;
}

.chart-btn {
  background: none;
  border: 1px solid var(--chart-border);
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.chart-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: var(--text-secondary);
}

/* D3 SVG Chart */
.d3-candlestick-chart {
  display: block;
  width: 100%;
  flex: 1;
}

/* D3 Chart Elements */
.candlestick .wick {
  opacity: 0.8;
}

.candlestick .candle-body {
  opacity: 0.9;
  stroke-width: 1;
}

.volume-bar {
  opacity: 0.6;
}

.indicator {
  stroke-width: 2;
  fill: none;
  opacity: 0.8;
}

.indicator-sma {
  stroke: #2196f3;
}

.indicator-ema {
  stroke: #ff9800;
}

.indicator-rsi {
  stroke: #9c27b0;
}

/* Axes */
.x-axis, .y-axis {
  font-size: 12px;
  color: var(--text-secondary);
}

.x-axis line, .y-axis line,
.x-axis path, .y-axis path {
  stroke: var(--chart-border);
}

.x-axis text, .y-axis text {
  fill: var(--text-secondary);
}

/* Chart Footer */
.chart-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--chart-border);
  background: var(--chart-background);
}

.chart-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

/* Loading and Error States */
.candlestick-chart.loading,
.candlestick-chart.error,
.candlestick-chart.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.no-data-message {
  text-align: center;
  font-size: 16px;
  color: var(--text-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .price-info {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  
  .chart-info {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
}
```

## 📋 Implementation Report & Decision Logic

### D3.js + React Integration Decisions

#### 1. **"React for State, D3 for DOM" Pattern (Swizec Teller)**
**Decision**: Pure separation where React manages component lifecycle and state, D3 handles all DOM manipulation.

**Logic**:
- React's virtual DOM conflicts with D3's direct DOM manipulation
- Clear separation prevents race conditions and update conflicts
- React handles data flow and user interactions
- D3 handles rendering performance and complex visualizations
- Easier to test each layer independently
- Better performance for complex chart operations

#### 2. **Custom Hooks for D3 Logic**
**Decision**: Encapsulate all D3 chart logic in custom hooks.

**Logic**:
- Reusable chart logic across different components
- Easier testing of D3 behavior in isolation
- Clean separation of concerns
- Better TypeScript integration with proper typing
- Easier to maintain and debug chart-specific logic

#### 3. **SVG vs Canvas Rendering**
**Decision**: Use SVG for interactive elements with future Canvas consideration for performance.

**Logic**:
- SVG provides easier interaction handling (hover, click, zoom)
- Better accessibility with semantic markup
- Easier styling with CSS and themes
- Canvas can be added later for high-frequency updates
- SVG sufficient for current requirements (< 10k data points)

### Data Integration Strategy

#### 4. **Context API Integration**
**Decision**: Consume all data through the Context API layer.

**Logic**:
- Consistent data flow pattern across application
- Automatic state management and caching
- Error handling centralized in context
- Loading states managed consistently
- Easy to swap data sources without changing chart component

#### 5. **Real-time Data Handling**
**Decision**: React to context updates with smooth D3 transitions.

**Logic**:
- D3 transitions provide smooth data updates
- React re-renders trigger D3 updates automatically
- Context API handles WebSocket data integration
- Chart doesn't need to know about data source
- Better user experience with animated updates

### Performance Optimization Decisions

#### 6. **Memoization Strategy**
**Decision**: Extensive use of useMemo for expensive D3 calculations.

**Logic**:
- D3 scale calculations are expensive for large datasets
- Data transformations should only run when data changes
- Component re-renders shouldn't trigger unnecessary D3 operations
- Better performance for rapid timeframe changes

#### 7. **Zoom and Pan Implementation**
**Decision**: Native D3 zoom behavior with transform caching.

**Logic**:
- D3 zoom provides smooth, native-feeling interactions
- Transform caching prevents expensive re-calculations
- Hardware acceleration through CSS transforms
- Consistent behavior across devices and browsers

## 🔧 Technical Tasks

### Phase 1: D3 Foundation Setup (Week 1)
- [ ] Install D3.js v7+ with TypeScript definitions
- [ ] Create core D3 chart hook with basic candlestick rendering
- [ ] Implement responsive dimensions hook
- [ ] Set up D3 scales (time, linear) with proper domains
- [ ] Add basic zoom and pan functionality

### Phase 2: Chart Features Implementation (Week 2)
- [ ] Build candlestick rendering with proper OHLC visualization
- [ ] Add volume overlay with synchronized scales
- [ ] Implement technical indicators overlay (SMA, EMA, RSI)
- [ ] Create crosshair and tooltip functionality
- [ ] Add theme support with D3 color scales

### Phase 3: Data Integration (Week 3)
- [ ] Integrate with Context API for data consumption
- [ ] Handle loading and error states properly
- [ ] Implement real-time data updates with D3 transitions
- [ ] Add timeframe switching with smooth animations
- [ ] Create chart interaction controls

### Phase 4: Performance and Polish (Week 4)
- [ ] Optimize rendering for large datasets (1000+ points)
- [ ] Add keyboard navigation and accessibility
- [ ] Implement chart export functionality
- [ ] Add comprehensive error boundaries
- [ ] Performance testing and optimization

## 🧪 Testing Strategy

### Unit Tests
- D3 hook logic with mocked data
- Scale calculations and transformations
- Chart interaction methods (zoom, pan, fit)
- Data transformation utilities
- Theme switching functionality

### Integration Tests
- Context API data consumption
- Real-time data updates and transitions
- Responsive behavior across screen sizes
- Error handling with various failure scenarios
- Performance benchmarks with large datasets

### Visual Regression Tests
- Chart rendering accuracy across themes
- Indicator visualization correctness
- Animation smoothness verification
- Cross-browser compatibility testing
- Mobile device interaction testing

## 📈 Success Metrics
- [ ] Chart renders 1000+ data points smoothly at 60fps
- [ ] Interactive features (zoom, pan) respond within 16ms
- [ ] Memory usage remains stable during real-time updates
- [ ] Seamless integration with Context API data flow
- [ ] Smooth animations during timeframe transitions

## 🔗 Dependencies
- **Story 2.1.1**: Context API Data Management (for data consumption)
- **Story 2.1.2**: Backend Request Infrastructure (for API integration)
- **Story 1.4**: Data Calculation Service (for technical indicators)

## 🚀 Next Steps
After completion, this chart component will enable:
- **Story 2.2**: Real-time data updates with WebSocket integration
- **Story 2.3**: Advanced chart controls and interface
- **Story 3.2**: Stock overview cards with mini charts
- **Story 5.1**: Real-time price updates and streaming data
