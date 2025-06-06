# Story 2.1: D3.js React Candlestick Chart Component

## ⚠️ **SUPERSEDED BY SUB-STORIES**
**This story has been refined and split into three detailed sub-stories for better project management and implementation clarity:**

- **[Story 2.1.1: Context API Data Management](./story-2.1.1-context-api-data-management.md)** - State management setup
- **[Story 2.1.2: Backend Request Infrastructure](./story-2.1.2-backend-request-infrastructure.md)** - API client and data fetching
- **[Story 2.1.3: D3.js Candlestick Chart Component](./story-2.1.3-d3js-candlestick-chart.md)** - Chart visualization implementation

**Please refer to the individual sub-stories above for current planning and implementation details.**

---

## 📋 Original Story Overview
**As a** trader/investor  
**I want** interactive candlestick charts built with D3.js and React following Swizec Teller's approach  
**So that** I can analyze stock price movements with high-performance, custom visualizations

---

## 🎯 User Story
**As a** trader/investor  
**I want** professional-grade candlestick charts with technical indicators  
**So that** I can perform detailed technical analysis with smooth, responsive interactions

## 📝 Acceptance Criteria

### D3.js + React Integration (Swizec Teller Pattern)
- [ ] Implement React component wrapper with D3.js rendering engine
- [ ] Use React for state management and lifecycle, D3 for DOM manipulation
- [ ] Custom hooks for D3 chart logic separation
- [ ] TypeScript integration for type-safe D3 operations
- [ ] Responsive design with automatic resize handling

### Core Chart Features
- [ ] Real-time candlestick chart rendering with D3.js transitions
- [ ] Interactive zoom and pan using d3-zoom
- [ ] Multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y, ALL) with smooth transitions
- [ ] Volume overlay with synchronized D3 scales
- [ ] Custom crosshair implementation with d3-selection
- [ ] Tooltip system using D3.js positioning and React portals

### Technical Indicators (Pre-calculated from Backend)
- [ ] Moving Averages (SMA, EMA) overlay lines with D3 line generators
- [ ] RSI subplot with overbought/oversold threshold lines
- [ ] MACD histogram and signal lines in dedicated subplot
- [ ] Bollinger Bands with D3 area generators for band fills
- [ ] Support/Resistance level detection

### User Experience
- [ ] Responsive design for mobile and desktop
- [ ] Theme support (light/dark mode)
- [ ] Loading states and error handling
- [ ] Performance optimization for large datasets
- [ ] Keyboard shortcuts for common actions

---

## 🛠️ Technical Implementation

### 1. Technology Stack
```typescript
// Dependencies to install
"dependencies": {
  "lightweight-charts": "^4.1.0",  // Primary charting library
  "date-fns": "^2.30.0",           // Date manipulation
  "react-query": "^3.39.3",        // Data fetching
  "zustand": "^4.4.1"              // State management
}
```

### 2. Chart Component Structure
```typescript
// File: components/Chart/CandlestickChart.tsx
interface CandlestickChartProps {
  symbol: string;
  timeframe: Timeframe;
  height?: number;
  showVolume?: boolean;
  indicators?: IndicatorConfig[];
  theme?: 'light' | 'dark';
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  timeframe,
  height = 500,
  showVolume = true,
  indicators = [],
  theme = 'light'
}) => {
  // Implementation
};
```

### 3. Data Models
```typescript
// File: types/ChartTypes.ts
export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorConfig {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BOLLINGER';
  period?: number;
  color?: string;
  visible: boolean;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
```

### 4. Chart Service
```typescript
// File: services/ChartService.ts
export class ChartService {
  private chart: IChartApi | null = null;
  private candlestickSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;

  initialize(container: HTMLElement, options: ChartOptions): void {
    this.chart = createChart(container, {
      width: options.width,
      height: options.height,
      layout: {
        background: { color: 'transparent' },
        textColor: options.theme === 'dark' ? '#D1D4DC' : '#333'
      },
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.5)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        timeVisible: true,
        secondsVisible: false
      }
    });

    this.setupSeries();
  }

  private setupSeries(): void {
    if (!this.chart) return;

    this.candlestickSeries = this.chart.addCandlestickSeries({
      upColor: '#4caf50',
      downColor: '#f44336',
      borderDownColor: '#f44336',
      borderUpColor: '#4caf50',
      wickDownColor: '#f44336',
      wickUpColor: '#4caf50'
    });

    this.volumeSeries = this.chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 }
    });
  }
}
```

### 5. Technical Indicators Implementation
```typescript
// File: utils/TechnicalIndicators.ts
export class TechnicalIndicators {
  static calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  static calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(firstSMA);
    
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    
    return ema;
  }

  static calculateRSI(data: number[], period: number = 14): number[] {
    // RSI implementation
  }

  static calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    // MACD implementation
  }
}
```

### D3.js Implementation Architecture (Swizec Teller Pattern)

#### Core Component Structure
```typescript
// useCandlestickChart.ts - Custom hook for D3 logic
export const useCandlestickChart = (
  data: OHLCV[],
  dimensions: { width: number; height: number }
) => {
  // D3 scales, generators, and chart logic
  // Returns ref and update functions
}

// CandlestickChart.tsx - React wrapper component
export const CandlestickChart: React.FC<Props> = ({
  data,
  indicators,
  onTimeframeChange
}) => {
  // React state management
  // D3 chart rendering via custom hook
  // Event handling bridge between D3 and React
}
```

#### Technical Implementation Details
- [ ] **D3 Scales Setup**
  - `d3.scaleTime()` for x-axis temporal data
  - `d3.scaleLinear()` for y-axis price data
  - `d3.scaleBand()` for candlestick width calculations
  - Synchronized scales across main chart and subplots

- [ ] **Data Processing Pipeline**
  - D3 data join patterns for efficient updates
  - Data transformation for candlestick path generation
  - Time-based data filtering for zoom levels
  - Real-time data streaming integration

- [ ] **Interaction Handling**
  - `d3-zoom` for pan and zoom functionality
  - `d3-brush` for time range selection
  - Custom mouse/touch event handlers
  - Keyboard navigation support

### Performance Optimizations
- [ ] **D3.js Specific Optimizations**
  - Canvas rendering for high-frequency data (>10k points)
  - SVG for interactive elements and overlays
  - Efficient data binding with `d3.selectAll().data()`
  - Transition management for smooth animations

- [ ] **React Integration Optimizations**
  - `useCallback` for D3 event handlers
  - `useMemo` for expensive D3 calculations
  - `useRef` for D3 DOM manipulation access
  - Debounced resize handling

### Backend Integration
- [ ] **Pre-calculated Data Consumption**
  - Fetch technical indicators from Story 1.4 calculation service
  - No client-side indicator calculations
  - Real-time updates via WebSocket for live data
  - Efficient data serialization for D3 consumption

### Swizec Teller Best Practices Implementation
- [ ] **"React for State, D3 for DOM" Pattern**
  - React manages component lifecycle and user interactions
  - D3 handles all SVG/Canvas rendering and animations
  - Clear separation of concerns between libraries

- [ ] **Custom Hooks for D3 Logic**
  - Encapsulate D3 chart logic in reusable hooks
  - Type-safe interfaces between React and D3
  - Testing strategy for D3 functionality

- [ ] **Animation and Transition Management**
  - D3 transitions for smooth data updates
  - React state for animation triggers
  - Performance-optimized animation scheduling

## 🔧 Technical Stack

### Dependencies
- [ ] `d3` - Core D3.js library (latest v7+)
- [ ] `@types/d3` - TypeScript definitions
- [ ] `d3-selection`, `d3-scale`, `d3-axis`, `d3-zoom`, `d3-brush`
- [ ] React 18+ with concurrent features
- [ ] TypeScript for type safety

### File Structure
```
src/components/charts/
├── CandlestickChart/
│   ├── CandlestickChart.tsx
│   ├── useCandlestickChart.ts
│   ├── chartHelpers.ts
│   ├── d3Generators.ts
│   └── types.ts
├── shared/
│   ├── useChartDimensions.ts
│   ├── chartUtils.ts
│   └── scales.ts
```

## 🎯 Learning Resources & References
- [ ] Study Swizec Teller's "React + D3" patterns
- [ ] Implement examples from "React + D3.js" course materials
- [ ] Follow D3.js Observable notebooks for advanced techniques
- [ ] Reference financial charting libraries for UX patterns

## 📋 Testing Strategy
- [ ] **Unit Tests**
  - D3 scale and generator functions
  - Data transformation utilities
  - Custom hook behavior

- [ ] **Integration Tests**
  - React-D3 interaction patterns
  - Chart responsiveness
  - Real-time data updates

- [ ] **Visual Regression Tests**
  - Chart rendering accuracy
  - Animation smoothness
  - Cross-browser compatibility

## 🎯 Success Metrics
- [ ] Chart renders 1000+ data points smoothly (60fps)
- [ ] Interactive features respond within 16ms
- [ ] Memory usage remains stable during real-time updates
- [ ] Charts work seamlessly across all modern browsers
- [ ] Developer experience: clear separation of React/D3 concerns

## 🔗 Dependencies
- **Story 1.4**: Data Calculation Service (for pre-calculated indicators)
- **Story 1.2**: Financial Data API Endpoints
- **Story 5.1**: Real-time Price Updates (for live chart updates)

## 🚀 Future Enhancements
- [ ] WebGL rendering for extreme performance
- [ ] Advanced D3 animations and micro-interactions
- [ ] Custom indicator builder interface
- [ ] Chart annotation and drawing tools
- [ ] Multi-chart synchronized analysis views
