# Story 3.2: Stock Overview Cards

## Overview
**Epic**: Stock Screener Interface  
**Story**: Stock Overview Cards  
**Priority**: High  
**Estimated Effort**: 2 days  

## User Story
**As a** user  
**I want** quick stock overview information in an intuitive card format  
**So that** I can rapidly assess multiple stocks and make informed decisions

## Acceptance Criteria

### Core Information Display
- [ ] **Current Price**: Large, prominent price display with currency formatting
- [ ] **Daily Change**: Absolute and percentage change with color coding (green/red)
- [ ] **Key Metrics**: P/E ratio, Market Cap, Daily Volume, 52-week high/low
- [ ] **Mini Chart**: Sparkline showing recent price trend (last 30 days)
- [ ] **Company Info**: Company name, sector, and exchange information

### Interactive Features
- [ ] **Watchlist Toggle**: One-click add/remove from watchlist with visual feedback
- [ ] **Quick Actions**: View full chart, company details, news links
- [ ] **Card Expansion**: Click to expand for additional metrics
- [ ] **Hover Effects**: Show additional info on hover/touch
- [ ] **Loading States**: Skeleton loading while data fetches

### Visual Design
- [ ] **Responsive Layout**: Cards adapt to grid layout (1-4 columns based on screen size)
- [ ] **Color Coding**: Consistent color scheme for gains/losses
- [ ] **Typography**: Clear hierarchy with readable fonts and sizes
- [ ] **Icons**: Intuitive icons for actions and status indicators
- [ ] **Dark Mode**: Full support for dark/light theme switching

## Technical Implementation

### Component Structure
```
components/StockCards/
├── StockCard.tsx              # Main card component
├── StockCardList.tsx          # Grid container for multiple cards
├── Sparkline.tsx              # Mini price chart
├── PriceChange.tsx            # Price change indicator
├── WatchlistButton.tsx        # Add/remove watchlist
├── StockMetrics.tsx           # Key financial metrics
├── QuickActions.tsx           # Action buttons
└── StockCardSkeleton.tsx      # Loading skeleton
```

### Data Models
```typescript
interface StockOverview {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  currentPrice: number;
  currency: string;
  priceChange: {
    absolute: number;
    percentage: number;
  };
  metrics: {
    peRatio: number | null;
    marketCap: number;
    volume: number;
    week52High: number;
    week52Low: number;
    avgVolume: number;
    beta: number | null;
  };
  sparklineData: SparklinePoint[];
  lastUpdate: string;
  isInWatchlist: boolean;
}

interface SparklinePoint {
  date: string;
  price: number;
}
```

### Stock Card Component
```typescript
interface StockCardProps {
  stock: StockOverview;
  onWatchlistToggle: (symbol: string, add: boolean) => void;
  onViewChart: (symbol: string) => void;
  onViewDetails: (symbol: string) => void;
  compact?: boolean;
  showSparkline?: boolean;
}

const StockCard: React.FC<StockCardProps> = ({
  stock,
  onWatchlistToggle,
  onViewChart,
  onViewDetails,
  compact = false,
  showSparkline = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchlistToggle = async () => {
    setIsLoading(true);
    try {
      await onWatchlistToggle(stock.symbol, !stock.isInWatchlist);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className={`stock-card ${compact ? 'compact' : ''} ${isExpanded ? 'expanded' : ''}`}>
      {/* Card content implementation */}
    </div>
  );
};
```

### Sparkline Component
```typescript
interface SparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showArea?: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color,
  strokeWidth = 1.5,
  showArea = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([minPrice, maxPrice])
      .range([height, 0]);

    const line = d3.line<SparklinePoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.price))
      .curve(d3.curveCardinal);

    // Determine color based on trend
    const trend = prices[prices.length - 1] - prices[0];
    const lineColor = color || (trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)');

    // Draw area if enabled
    if (showArea) {
      const area = d3.area<SparklinePoint>()
        .x((_, i) => xScale(i))
        .y0(height)
        .y1(d => yScale(d.price))
        .curve(d3.curveCardinal);

      svg.append('path')
        .datum(data)
        .attr('d', area)
        .attr('fill', lineColor)
        .attr('opacity', 0.1);
    }

    // Draw line
    svg.append('path')
      .datum(data)
      .attr('d', line)
      .attr('stroke', lineColor)
      .attr('stroke-width', strokeWidth)
      .attr('fill', 'none');

  }, [data, width, height, color, strokeWidth, showArea]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="sparkline"
    />
  );
};
```

### Price Change Indicator
```typescript
interface PriceChangeProps {
  change: {
    absolute: number;
    percentage: number;
  };
  currency?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const PriceChange: React.FC<PriceChangeProps> = ({
  change,
  currency = 'USD',
  size = 'medium',
  showIcon = true,
}) => {
  const isPositive = change.absolute >= 0;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  return (
    <div className={`price-change ${size} ${isPositive ? 'positive' : 'negative'}`}>
      {showIcon && (
        <span className="change-icon">
          {isPositive ? '↗' : '↘'}
        </span>
      )}
      <span className="change-absolute">
        {isPositive ? '+' : '-'}{formatCurrency(change.absolute)}
      </span>
      <span className="change-percentage">
        ({isPositive ? '+' : ''}{change.percentage.toFixed(2)}%)
      </span>
    </div>
  );
};
```

### Watchlist Button
```typescript
interface WatchlistButtonProps {
  isInWatchlist: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  size?: 'small' | 'medium' | 'large';
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  isInWatchlist,
  isLoading = false,
  onToggle,
  size = 'medium',
}) => {
  return (
    <button
      className={`watchlist-button ${size} ${isInWatchlist ? 'active' : ''}`}
      onClick={onToggle}
      disabled={isLoading}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isLoading ? (
        <div className="loading-spinner" />
      ) : (
        <span className="watchlist-icon">
          {isInWatchlist ? '★' : '☆'}
        </span>
      )}
    </button>
  );
};
```

## CSS Styles

### Stock Card Styles
```css
.stock-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stock-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stock-card.compact {
  padding: 1rem;
}

.stock-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.stock-symbol {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.stock-name {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
  line-height: 1.2;
}

.stock-price {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0.5rem 0;
}

.price-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.price-change.positive {
  color: var(--color-success);
}

.price-change.negative {
  color: var(--color-danger);
}

.change-icon {
  font-size: 0.875rem;
}

.stock-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin: 1rem 0;
  font-size: 0.875rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: var(--color-text-secondary);
}

.metric-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.stock-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.watchlist-button {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-background);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
}

.watchlist-button.active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: white;
}

.watchlist-button:hover {
  transform: scale(1.1);
}

.watchlist-icon {
  font-size: 1.25rem;
}

.sparkline {
  display: block;
  margin: 0.5rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stock-card {
    padding: 1rem;
  }
  
  .stock-price {
    font-size: 1.5rem;
  }
  
  .stock-metrics {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .quick-actions {
    flex-wrap: wrap;
  }
  
  .action-button {
    flex: 1;
    min-width: 0;
  }
}

/* Loading Skeleton */
.stock-card-skeleton {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 1rem;
  background: var(--color-border);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-line.medium {
  width: 80%;
}

.skeleton-line.long {
  width: 100%;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

## API Integration

### Stock Overview Endpoint
```typescript
// GET /api/stocks/overview?symbols=AAPL,MSFT,GOOGL&include=sparkline,metrics
interface StockOverviewRequest {
  symbols: string[];
  include?: ('sparkline' | 'metrics' | 'news')[];
  sparklineDays?: number;
}

interface StockOverviewResponse {
  stocks: StockOverview[];
  lastUpdate: string;
  errors?: {
    symbol: string;
    error: string;
  }[];
}
```

### Watchlist API
```typescript
// POST /api/watchlist
interface WatchlistToggleRequest {
  symbol: string;
  action: 'add' | 'remove';
}

interface WatchlistToggleResponse {
  success: boolean;
  isInWatchlist: boolean;
  message?: string;
}
```

## State Management

### Stock Cards Store
```typescript
interface StockCardsState {
  stocks: Record<string, StockOverview>;
  loading: Set<string>;
  errors: Record<string, string>;
  selectedSymbols: string[];
  watchlist: Set<string>;
  lastUpdate: string | null;
}

const useStockCardsStore = create<StockCardsState>((set, get) => ({
  stocks: {},
  loading: new Set(),
  errors: {},
  selectedSymbols: [],
  watchlist: new Set(),
  lastUpdate: null,

  // Actions
  addToWatchlist: async (symbol: string) => {
    set(state => ({
      loading: new Set([...state.loading, symbol])
    }));

    try {
      const response = await api.toggleWatchlist({ symbol, action: 'add' });
      set(state => ({
        watchlist: new Set([...state.watchlist, symbol]),
        stocks: {
          ...state.stocks,
          [symbol]: {
            ...state.stocks[symbol],
            isInWatchlist: true
          }
        },
        loading: new Set([...state.loading].filter(s => s !== symbol))
      }));
    } catch (error) {
      set(state => ({
        errors: { ...state.errors, [symbol]: error.message },
        loading: new Set([...state.loading].filter(s => s !== symbol))
      }));
    }
  },

  removeFromWatchlist: async (symbol: string) => {
    // Similar implementation for removal
  },

  updateStockData: (stockData: StockOverview[]) => {
    const stocksMap = stockData.reduce((acc, stock) => {
      acc[stock.symbol] = stock;
      return acc;
    }, {} as Record<string, StockOverview>);

    set(state => ({
      stocks: { ...state.stocks, ...stocksMap },
      lastUpdate: new Date().toISOString()
    }));
  },
}));
```

## Testing Strategy

### Unit Tests
```typescript
describe('StockCard', () => {
  const mockStock: StockOverview = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    exchange: 'NASDAQ',
    currentPrice: 150.25,
    currency: 'USD',
    priceChange: { absolute: 2.50, percentage: 1.69 },
    metrics: {
      peRatio: 25.5,
      marketCap: 2500000000000,
      volume: 50000000,
      week52High: 180.00,
      week52Low: 120.00,
      avgVolume: 75000000,
      beta: 1.2,
    },
    sparklineData: [],
    lastUpdate: '2024-01-15T16:00:00Z',
    isInWatchlist: false,
  };

  test('renders stock information correctly', () => {
    render(
      <StockCard
        stock={mockStock}
        onWatchlistToggle={jest.fn()}
        onViewChart={jest.fn()}
        onViewDetails={jest.fn()}
      />
    );

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('$150.25')).toBeInTheDocument();
    expect(screen.getByText('+$2.50')).toBeInTheDocument();
    expect(screen.getByText('(+1.69%)')).toBeInTheDocument();
  });

  test('handles watchlist toggle', async () => {
    const mockToggle = jest.fn();
    render(
      <StockCard
        stock={mockStock}
        onWatchlistToggle={mockToggle}
        onViewChart={jest.fn()}
        onViewDetails={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Add to watchlist'));
    expect(mockToggle).toHaveBeenCalledWith('AAPL', true);
  });

  test('shows correct color for price changes', () => {
    const { rerender } = render(
      <StockCard
        stock={mockStock}
        onWatchlistToggle={jest.fn()}
        onViewChart={jest.fn()}
        onViewDetails={jest.fn()}
      />
    );

    expect(screen.getByText('+$2.50')).toHaveClass('positive');

    const negativeStock = {
      ...mockStock,
      priceChange: { absolute: -1.25, percentage: -0.83 }
    };

    rerender(
      <StockCard
        stock={negativeStock}
        onWatchlistToggle={jest.fn()}
        onViewChart={jest.fn()}
        onViewDetails={jest.fn()}
      />
    );

    expect(screen.getByText('-$1.25')).toHaveClass('negative');
  });
});

describe('Sparkline', () => {
  const mockData = [
    { date: '2024-01-01', price: 145 },
    { date: '2024-01-02', price: 147 },
    { date: '2024-01-03', price: 150 },
    { date: '2024-01-04', price: 148 },
    { date: '2024-01-05', price: 152 },
  ];

  test('renders SVG sparkline', () => {
    render(<Sparkline data={mockData} />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  test('uses correct color for trend', () => {
    const { container } = render(<Sparkline data={mockData} />);
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('stroke', expect.stringContaining('success'));
  });
});
```

### Integration Tests
```typescript
describe('Stock Cards Integration', () => {
  test('updates watchlist across multiple cards', async () => {
    const stocks = [mockStock, { ...mockStock, symbol: 'MSFT' }];
    
    render(<StockCardList stocks={stocks} />);
    
    // Add AAPL to watchlist
    fireEvent.click(screen.getAllByLabelText('Add to watchlist')[0]);
    
    await waitFor(() => {
      expect(screen.getAllByLabelText('Remove from watchlist')[0]).toBeInTheDocument();
    });
  });

  test('navigates to chart view', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));

    render(<StockCard stock={mockStock} />);
    
    fireEvent.click(screen.getByText('View Chart'));
    expect(mockNavigate).toHaveBeenCalledWith('/chart/AAPL');
  });
});
```

## Performance Optimizations

### Virtualization for Large Lists
```typescript
import { FixedSizeGrid as Grid } from 'react-window';

const VirtualizedStockCards = ({ stocks }: { stocks: StockOverview[] }) => {
  const itemData = useMemo(() => ({
    stocks,
    itemsPerRow: 3,
  }), [stocks]);

  const Cell = ({ columnIndex, rowIndex, style, data }) => {
    const index = rowIndex * data.itemsPerRow + columnIndex;
    const stock = data.stocks[index];
    
    if (!stock) return null;

    return (
      <div style={style}>
        <StockCard stock={stock} />
      </div>
    );
  };

  return (
    <Grid
      columnCount={3}
      columnWidth={350}
      height={600}
      rowCount={Math.ceil(stocks.length / 3)}
      rowHeight={280}
      itemData={itemData}
    >
      {Cell}
    </Grid>
  );
};
```

### Memoization
```typescript
const MemoizedStockCard = React.memo(StockCard, (prevProps, nextProps) => {
  return (
    prevProps.stock.symbol === nextProps.stock.symbol &&
    prevProps.stock.currentPrice === nextProps.stock.currentPrice &&
    prevProps.stock.priceChange.absolute === nextProps.stock.priceChange.absolute &&
    prevProps.stock.isInWatchlist === nextProps.stock.isInWatchlist
  );
});
```

## Accessibility

### ARIA Labels and Roles
```typescript
<div
  className="stock-card"
  role="article"
  aria-labelledby={`stock-${stock.symbol}-name`}
  aria-describedby={`stock-${stock.symbol}-price`}
>
  <h3 id={`stock-${stock.symbol}-name`} className="stock-symbol">
    {stock.symbol}
  </h3>
  <p id={`stock-${stock.symbol}-price`} className="stock-price">
    {formatCurrency(stock.currentPrice)}
  </p>
  
  <button
    aria-label={`${stock.isInWatchlist ? 'Remove' : 'Add'} ${stock.symbol} ${stock.isInWatchlist ? 'from' : 'to'} watchlist`}
    onClick={handleWatchlistToggle}
  >
    {/* Button content */}
  </button>
</div>
```

### Keyboard Navigation
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onViewChart(stock.symbol);
      break;
    case 'w':
    case 'W':
      event.preventDefault();
      handleWatchlistToggle();
      break;
  }
};
```

## Future Enhancements

### Phase 2 Features
- [ ] **Drag & Drop**: Drag cards to reorder or create custom lists
- [ ] **Card Animations**: Smooth transitions for layout changes
- [ ] **Custom Metrics**: User-selectable metrics to display
- [ ] **Comparison Mode**: Select multiple cards for side-by-side comparison
- [ ] **Card Themes**: Different visual themes for different sectors

### Advanced Features
- [ ] **Real-time Updates**: Live price updates with smooth animations
- [ ] **Social Features**: Share cards with social media integration
- [ ] **AI Insights**: Machine learning-based stock recommendations
- [ ] **Voice Search**: Voice-activated stock search and navigation
- [ ] **Gesture Controls**: Swipe actions for mobile devices

---

**Dependencies**: Story 1.2 (API Endpoints), Story 3.1 (Stock Search)  
**Blockers**: None  
**Definition of Done**: All acceptance criteria met, responsive design tested, accessibility audit passed, performance benchmarks met
