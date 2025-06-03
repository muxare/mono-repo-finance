# Story 2.3: Chart Controls & Interface

## Overview
**Epic**: Frontend Chart Components & Visualization  
**Story**: Chart Controls & Interface  
**Priority**: High  
**Estimated Effort**: 3 days  

## User Story
**As a** user  
**I want** intuitive chart controls  
**So that** I can easily navigate and analyze stock data with professional-grade tools

## Acceptance Criteria

### Core Functionality
- [ ] **Timeframe Selector**: Quick buttons for 1D, 1W, 1M, 3M, 6M, 1Y, All timeframes
- [ ] **Chart Type Selector**: Toggle between Candlestick, Line, and Area chart types
- [ ] **Technical Indicator Panel**: Add/remove indicators with configuration options
- [ ] **Full-Screen Mode**: Toggle chart to full-screen view for detailed analysis
- [ ] **Chart Settings**: Customize colors, grid lines, and display preferences
- [ ] **Export Functionality**: Save chart as PNG/SVG with current settings

### User Experience
- [ ] **Keyboard Shortcuts**: Arrow keys for navigation, +/- for zoom, spacebar for full-screen
- [ ] **Responsive Design**: Controls adapt to mobile and tablet layouts
- [ ] **Tooltips & Help**: Contextual help for all controls and features
- [ ] **Settings Persistence**: Remember user preferences across sessions
- [ ] **Quick Reset**: One-click reset to default view and settings

### Performance & Accessibility
- [ ] **Fast Rendering**: Controls respond within 100ms
- [ ] **ARIA Labels**: Full accessibility support for screen readers
- [ ] **Keyboard Navigation**: All controls accessible via keyboard
- [ ] **Mobile Touch**: Optimized touch targets for mobile devices

## Technical Implementation

### Components Structure
```
components/Chart/
├── ChartControls.tsx          # Main controls container
├── TimeframeSelector.tsx      # Time period buttons
├── ChartTypeSelector.tsx      # Chart style toggle
├── IndicatorPanel.tsx         # Technical indicators
├── ChartSettings.tsx          # Settings modal
├── ExportDialog.tsx           # Chart export options
└── FullScreenToggle.tsx       # Full-screen button
```

### Key Features

#### 1. Timeframe Selector Component
```typescript
interface TimeframeOption {
  label: string;
  value: string;
  days: number;
  isDefault?: boolean;
}

const timeframes: TimeframeOption[] = [
  { label: '1D', value: '1D', days: 1 },
  { label: '1W', value: '1W', days: 7 },
  { label: '1M', value: '1M', days: 30 },
  { label: '3M', value: '3M', days: 90 },
  { label: '6M', value: '6M', days: 180 },
  { label: '1Y', value: '1Y', days: 365, isDefault: true },
  { label: 'All', value: 'ALL', days: 0 },
];
```

#### 2. Chart Type Selector
```typescript
enum ChartType {
  CANDLESTICK = 'candlestick',
  LINE = 'line',
  AREA = 'area'
}

interface ChartTypeOption {
  type: ChartType;
  label: string;
  icon: string;
  description: string;
}
```

#### 3. Technical Indicator Panel
```typescript
interface TechnicalIndicator {
  id: string;
  name: string;
  category: 'overlay' | 'oscillator';
  enabled: boolean;
  config: Record<string, any>;
}

const availableIndicators = [
  { id: 'sma', name: 'Simple Moving Average', category: 'overlay' },
  { id: 'ema', name: 'Exponential Moving Average', category: 'overlay' },
  { id: 'bollinger', name: 'Bollinger Bands', category: 'overlay' },
  { id: 'rsi', name: 'RSI', category: 'oscillator' },
  { id: 'macd', name: 'MACD', category: 'oscillator' },
];
```

#### 4. Chart Settings
```typescript
interface ChartSettings {
  theme: 'light' | 'dark';
  gridLines: boolean;
  priceScale: 'linear' | 'logarithmic';
  candlestickColors: {
    up: string;
    down: string;
    upWick: string;
    downWick: string;
  };
  background: string;
  fontSize: number;
}
```

#### 5. Keyboard Shortcuts
```typescript
const keyboardShortcuts = {
  'ArrowLeft': 'Pan left',
  'ArrowRight': 'Pan right',
  'ArrowUp': 'Zoom in',
  'ArrowDown': 'Zoom out',
  'Space': 'Toggle full-screen',
  'Escape': 'Exit full-screen',
  'R': 'Reset zoom',
  'S': 'Open settings',
  'E': 'Export chart',
  '1-7': 'Select timeframe',
};
```

### State Management
```typescript
interface ChartControlsState {
  timeframe: string;
  chartType: ChartType;
  indicators: TechnicalIndicator[];
  settings: ChartSettings;
  isFullScreen: boolean;
  isSettingsOpen: boolean;
  isExportDialogOpen: boolean;
}

// Use Zustand store for chart controls state
const useChartControlsStore = create<ChartControlsState>((set, get) => ({
  // Initial state and actions
}));
```

## API Integration

### Chart Data Endpoint
```typescript
// Extend existing API to support chart-specific parameters
GET /api/stocks/{symbol}/chart-data?timeframe=1Y&indicators=sma,rsi&interval=1d

interface ChartDataResponse {
  symbol: string;
  timeframe: string;
  interval: string;
  prices: OHLCV[];
  indicators: {
    [key: string]: IndicatorData[];
  };
  metadata: {
    timezone: string;
    lastUpdate: string;
    totalDataPoints: number;
  };
}
```

### Settings Persistence
```typescript
// Local storage for user preferences
const CHART_SETTINGS_KEY = 'finance-screener-chart-settings';

const saveChartSettings = (settings: ChartSettings) => {
  localStorage.setItem(CHART_SETTINGS_KEY, JSON.stringify(settings));
};

const loadChartSettings = (): ChartSettings => {
  const saved = localStorage.getItem(CHART_SETTINGS_KEY);
  return saved ? JSON.parse(saved) : defaultSettings;
};
```

## UI/UX Design

### Control Panel Layout
```css
.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timeframe-buttons {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.timeframe-button {
  padding: 0.5rem 1rem;
  border: none;
  background: var(--color-background);
  transition: background-color 0.2s;
}

.timeframe-button.active {
  background: var(--color-primary);
  color: white;
}
```

### Mobile Responsiveness
```css
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .timeframe-buttons {
    width: 100%;
  }
  
  .timeframe-button {
    flex: 1;
    min-height: 44px; /* Touch target */
  }
  
  .indicator-panel {
    order: -1; /* Move to top on mobile */
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('ChartControls', () => {
  test('renders all timeframe options', () => {
    render(<TimeframeSelector />);
    timeframes.forEach(tf => {
      expect(screen.getByText(tf.label)).toBeInTheDocument();
    });
  });

  test('calls onTimeframeChange when button clicked', () => {
    const mockCallback = jest.fn();
    render(<TimeframeSelector onTimeframeChange={mockCallback} />);
    
    fireEvent.click(screen.getByText('1M'));
    expect(mockCallback).toHaveBeenCalledWith('1M');
  });

  test('keyboard shortcuts work correctly', () => {
    render(<ChartControls />);
    
    fireEvent.keyDown(document, { key: 'Space' });
    expect(screen.getByTestId('fullscreen-mode')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
describe('Chart Controls Integration', () => {
  test('changing timeframe updates chart data', async () => {
    const { getByText, getByTestId } = render(<ChartPage symbol="AAPL" />);
    
    fireEvent.click(getByText('1M'));
    
    await waitFor(() => {
      expect(getByTestId('chart-container')).toHaveAttribute('data-timeframe', '1M');
    });
  });

  test('adding indicator updates chart display', async () => {
    const { getByText, getByTestId } = render(<ChartPage symbol="AAPL" />);
    
    fireEvent.click(getByText('Add Indicator'));
    fireEvent.click(getByText('RSI'));
    
    await waitFor(() => {
      expect(getByTestId('rsi-indicator')).toBeInTheDocument();
    });
  });
});
```

## Performance Considerations

### Optimization Strategies
1. **Debounced Updates**: Prevent excessive API calls during rapid timeframe changes
2. **Memoized Components**: Use React.memo for expensive chart controls
3. **Lazy Loading**: Load indicator configurations only when needed
4. **Virtual Indicators**: Only render visible technical indicators
5. **Settings Caching**: Cache settings in memory to avoid localStorage reads

### Bundle Size
- Tree-shake unused indicator libraries
- Use dynamic imports for chart export functionality
- Optimize icon libraries (use only needed icons)

## Deployment Notes

### Feature Flags
```typescript
const featureFlags = {
  advancedIndicators: process.env.REACT_APP_ADVANCED_INDICATORS === 'true',
  chartExport: process.env.REACT_APP_CHART_EXPORT === 'true',
  customTimeframes: process.env.REACT_APP_CUSTOM_TIMEFRAMES === 'true',
};
```

### Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Graceful degradation for older browsers
- Polyfills for missing features

## Future Enhancements

### Phase 2 Features
- [ ] **Custom Timeframes**: Allow users to set custom date ranges
- [ ] **Chart Templates**: Save and load chart configurations
- [ ] **Drawing Tools**: Trend lines, fibonacci retracements, annotations
- [ ] **Multi-Chart Layouts**: Split screen with multiple timeframes
- [ ] **Chart Alerts**: Set price or indicator-based alerts directly on chart
- [ ] **Social Sharing**: Share chart snapshots with annotations

### Advanced Features
- [ ] **Chart Synchronization**: Sync multiple charts across different symbols
- [ ] **Indicator Scripting**: Custom indicator creation with simple scripting
- [ ] **Pattern Recognition**: Automatic chart pattern detection
- [ ] **Voice Commands**: Control charts with voice navigation
- [ ] **Gesture Controls**: Touch gestures for mobile chart navigation

---

**Dependencies**: Stories 2.1 (Candlestick Chart), 2.2 (Real-time Updates)  
**Blockers**: None  
**Definition of Done**: All acceptance criteria met, tests passing, responsive design verified, accessibility audit completed
