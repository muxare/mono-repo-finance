# Story 2.1: Candlestick Chart Component

## 📋 Story Overview
**As a** trader/investor  
**I want** interactive candlestick charts with technical indicators  
**So that** I can analyze stock price movements and make informed decisions

---

## 🎯 Acceptance Criteria

### Core Chart Features
- [ ] Real-time candlestick chart rendering with smooth animations
- [ ] Interactive zoom and pan capabilities with touch/mouse support
- [ ] Multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- [ ] Volume overlay with synchronized scaling
- [ ] Crosshair with price/time tooltip display

### Technical Indicators
- [ ] Moving Averages (SMA, EMA) with customizable periods
- [ ] RSI (Relative Strength Index) with overbought/oversold levels
- [ ] MACD (Moving Average Convergence Divergence)
- [ ] Bollinger Bands with standard deviation settings
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

---

## 📁 Component Structure
```
apps/web/src/
├── components/
│   ├── Chart/
│   │   ├── CandlestickChart.tsx
│   │   ├── ChartControls.tsx
│   │   ├── TimeframeSelector.tsx
│   │   ├── IndicatorPanel.tsx
│   │   └── VolumeChart.tsx
│   ├── Indicators/
│   │   ├── MovingAverage.tsx
│   │   ├── RSIIndicator.tsx
│   │   └── MACDIndicator.tsx
├── services/
│   ├── ChartService.ts
│   └── ChartDataService.ts
├── utils/
│   ├── TechnicalIndicators.ts
│   └── ChartHelpers.ts
├── hooks/
│   ├── useChartData.ts
│   ├── useChart.ts
│   └── useIndicators.ts
└── types/
    └── ChartTypes.ts
```

---

## 🧪 Testing Strategy

### Component Tests
- [ ] Render chart with mock data
- [ ] Test timeframe switching
- [ ] Validate indicator calculations
- [ ] Test responsive behavior

### Integration Tests
- [ ] Chart data loading and display
- [ ] Real-time updates functionality
- [ ] Cross-browser compatibility
- [ ] Performance with large datasets

### Visual Testing
- [ ] Screenshot comparisons for chart rendering
- [ ] Animation and interaction testing
- [ ] Theme switching validation

---

## 🎨 Design Specifications

### Color Scheme
```css
:root {
  /* Candlestick Colors */
  --bull-candle: #4caf50;
  --bear-candle: #f44336;
  --wick-color: #757575;
  
  /* Volume Colors */
  --volume-up: rgba(76, 175, 80, 0.7);
  --volume-down: rgba(244, 67, 54, 0.7);
  
  /* Grid and Background */
  --chart-background: #ffffff;
  --grid-color: rgba(197, 203, 206, 0.5);
  --crosshair-color: #758696;
  
  /* Dark Theme */
  --dark-chart-background: #1e1e1e;
  --dark-grid-color: rgba(42, 46, 57, 0.5);
  --dark-text-color: #d1d4dc;
}
```

### Responsive Breakpoints
- **Mobile**: < 768px - Simplified controls, touch-optimized
- **Tablet**: 768px - 1024px - Condensed layout
- **Desktop**: > 1024px - Full feature set

---

## 🚀 Implementation Phases

### Phase 1: Basic Chart (Week 1)
- [ ] Set up lightweight-charts library
- [ ] Create basic candlestick chart component
- [ ] Implement data loading from API
- [ ] Add basic zoom/pan functionality

### Phase 2: Enhanced Features (Week 2)
- [ ] Add volume overlay
- [ ] Implement timeframe selection
- [ ] Create responsive design
- [ ] Add loading and error states

### Phase 3: Technical Indicators (Week 3)
- [ ] Implement moving averages (SMA/EMA)
- [ ] Add RSI indicator
- [ ] Create MACD visualization
- [ ] Add Bollinger Bands

### Phase 4: Advanced Features (Week 4)
- [ ] Real-time data updates
- [ ] Custom indicator configuration
- [ ] Chart annotation tools
- [ ] Export functionality

---

## 🔗 API Integration

### Required Endpoints
```typescript
// Chart data endpoint
GET /api/stocks/{symbol}/chart?timeframe=1M&indicators=SMA,RSI

// Real-time updates
WebSocket: /ws/chart/{symbol}
```

### Data Format
```json
{
  "symbol": "AAPL",
  "timeframe": "1M",
  "data": [
    {
      "timestamp": 1699632000,
      "open": 174.67,
      "high": 175.42,
      "low": 173.66,
      "close": 174.67,
      "volume": 21907100
    }
  ],
  "indicators": {
    "SMA_20": [172.45, 173.21, 174.12],
    "RSI_14": [45.67, 47.23, 51.89]
  }
}
```

---

## 📈 Performance Targets
- Initial chart render: < 500ms
- Data update: < 100ms
- Smooth 60fps animations
- Memory usage: < 100MB for 1 year of data
- Support up to 10,000 data points

---

## 🛡️ Accessibility
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] High contrast mode
- [ ] Focus indicators
- [ ] ARIA labels and descriptions

---

## 🔗 Dependencies
- **Prerequisites**: Story 1.2 (API Endpoints) for data access
- **Related**: Story 2.2 (Real-time Updates) for live data
- **Integration**: Story 3.1 (Stock Search) for symbol selection
