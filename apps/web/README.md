# Finance Screener - Frontend Application

A modern React + TypeScript + Vite application for financial data visualization and analysis.

## 🚀 Features

### Chart Components
- **Interactive Candlestick Charts**: D3.js-powered OHLC visualization with zoom, pan, and crosshair
- **Multiple Timeframes**: Support for 1D, 1W, 1M, 3M, 6M, 1Y, ALL periods
- **Volume Overlays**: Configurable volume bars with independent scaling
- **Technical Indicators**: Framework for SMA, EMA, RSI, MACD, Bollinger Bands
- **Responsive Design**: Mobile-optimized with touch interactions
- **Theming**: Light and dark mode support

### Data Management
- **Context API**: Centralized state management for financial data
- **React Query**: Optimized caching and real-time data synchronization
- **SignalR Integration**: Real-time price updates and market data
- **Error Handling**: Comprehensive error boundaries and fallback states

## 🏗️ Architecture

### Core Components
```
src/
├── components/
│   ├── Chart/
│   │   ├── CandlestickChart.tsx     # Main chart component
│   │   └── CandlestickChart.css     # Chart styling
│   └── CandlestickChartDemo.tsx     # Interactive demo
├── hooks/
│   ├── useChartDimensions.ts        # Responsive chart sizing
│   ├── useCandlestickChart.ts       # D3.js rendering logic
│   └── useStockData.ts              # Data fetching hooks
├── contexts/
│   └── FinancialDataContext.tsx     # Global state management
├── services/
│   └── api/                         # Backend integration
└── types/
    ├── ApiTypes.ts                  # API interfaces
    ├── ChartTypes.ts                # Chart-specific types
    └── FinancialTypes.ts            # Domain models
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Usage Example
```tsx
import { CandlestickChart } from './components/Chart';

function App() {
  return (
    <CandlestickChart
      symbol="AAPL"
      timeframe="1D"
      height={500}
      showVolume={true}
      indicators={[
        { type: 'SMA', visible: true, parameters: { period: 20 } },
        { type: 'EMA', visible: true, parameters: { period: 50 } }
      ]}
      theme="light"
    />
  );
}
```

## 🎨 Theming

The application supports comprehensive theming with CSS variables:

```css
:root {
  --chart-bg: #ffffff;
  --chart-text: #333333;
  --chart-grid: #e0e0e0;
  --chart-bull: #26a69a;
  --chart-bear: #ef5350;
}

[data-theme="dark"] {
  --chart-bg: #1a1a1a;
  --chart-text: #ffffff;
  --chart-grid: #333333;
  --chart-bull: #4caf50;
  --chart-bear: #f44336;
}
```

## 📊 Chart Features

### Interactive Elements
- **Zoom & Pan**: Mouse wheel and drag interactions
- **Crosshair**: Real-time price and time display
- **Touch Support**: Mobile-optimized gestures
- **Keyboard Navigation**: Accessibility-compliant controls

### Data Visualization
- **OHLC Candlesticks**: Traditional green/red coloring
- **Volume Bars**: Semi-transparent overlay
- **Technical Indicators**: Configurable overlays
- **Grid Lines**: Subtle reference lines
- **Responsive Axes**: Smart tick formatting

## 🔧 Development

### Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler
```

### Testing
```bash
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm e2e          # Run end-to-end tests
```

## 🏆 Technology Stack

## 🏆 Technology Stack

### Frontend
- **React 18**: Modern component-based UI framework
- **TypeScript**: Type-safe development with excellent IDE support
- **Vite**: Fast build tool with hot module replacement
- **D3.js**: Powerful data visualization and SVG manipulation
- **React Query**: Server state management and caching
- **Axios**: HTTP client with interceptors and retry logic

### Styling
- **CSS Modules**: Scoped styling with PostCSS
- **CSS Variables**: Dynamic theming support
- **Responsive Design**: Mobile-first approach

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Vite Dev Server**: Fast development experience

## 📈 Performance

### Optimizations
- **Code Splitting**: Lazy loading of chart components
- **Memoization**: Optimized re-renders with React.memo
- **Virtual Scrolling**: Efficient handling of large datasets
- **Request Deduplication**: Prevent duplicate API calls
- **Smart Caching**: Intelligent cache invalidation strategies

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔗 Related Projects

- **[Finance Screener API](../api/)**: Backend services and data management
- **[Project Documentation](../../docs/)**: Complete project specifications
- **[Database Schema](../../docs/planning/story-1.1-database-design.md)**: Entity relationship diagrams

---

**Created with ❤️ using React + TypeScript + Vite + D3.js**
    ...reactDom.configs.recommended.rules,
  },
})
```
