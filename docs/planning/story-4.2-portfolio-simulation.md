# Story 4.2: Portfolio Simulation

## Overview
**Epic**: Advanced Features & Analytics  
**Story**: Portfolio Simulation  
**Priority**: Medium  
**Estimated Effort**: 5 days  

## User Story
**As a** user  
**I want** to simulate portfolio performance with virtual trading  
**So that** I can test investment strategies without risking real money

## Acceptance Criteria

### Portfolio Creation & Management
- [ ] **Create Virtual Portfolios**: Multiple portfolios with custom names and starting capital
- [ ] **Starting Capital**: Set initial virtual cash amount (default $100,000)
- [ ] **Portfolio Cloning**: Copy existing portfolios to test variations
- [ ] **Portfolio Deletion**: Remove portfolios with confirmation dialog
- [ ] **Portfolio Sharing**: Share portfolio performance with view-only links

### Trading Simulation
- [ ] **Buy Orders**: Purchase stocks at current market price
- [ ] **Sell Orders**: Sell holdings at current market price  
- [ ] **Partial Sales**: Sell portion of holdings (e.g., 50 of 100 shares)
- [ ] **Order History**: Complete transaction log with timestamps
- [ ] **Commission Simulation**: Optional trading fees (default $0, configurable)

### Portfolio Analytics
- [ ] **Performance Tracking**: Total return, daily P&L, percentage gains/losses
- [ ] **Asset Allocation**: Pie chart showing portfolio composition by stock/cash
- [ ] **Sector Diversification**: Holdings breakdown by sector
- [ ] **Historical Performance**: Portfolio value chart over time
- [ ] **Benchmark Comparison**: Compare performance vs S&P 500, NASDAQ, custom indices

### Risk Analysis
- [ ] **Portfolio Beta**: Calculate portfolio beta vs market
- [ ] **Volatility Metrics**: Standard deviation and Sharpe ratio
- [ ] **Correlation Analysis**: Holdings correlation matrix
- [ ] **Value at Risk (VaR)**: Estimate potential losses
- [ ] **Maximum Drawdown**: Largest peak-to-trough decline

## Technical Implementation

### Component Structure
```
components/Portfolio/
├── PortfolioManager.tsx       # Main portfolio interface
├── PortfolioList.tsx          # List of all portfolios
├── PortfolioDetail.tsx        # Individual portfolio view
├── PortfolioCreator.tsx       # Create new portfolio dialog
├── TradingInterface.tsx       # Buy/sell stocks interface
├── OrderHistory.tsx           # Transaction history
├── PortfolioChart.tsx         # Performance visualization
├── AssetAllocation.tsx        # Pie chart of holdings
├── PerformanceMetrics.tsx     # Key performance indicators
├── RiskAnalysis.tsx           # Risk metrics display
├── BenchmarkComparison.tsx    # Performance vs benchmarks
└── PortfolioExport.tsx        # Export functionality
```

### Data Models
```typescript
interface Portfolio {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  startingCash: number;
  currentCash: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  holdings: PortfolioHolding[];
  transactions: Transaction[];
  settings: PortfolioSettings;
  analytics: PortfolioAnalytics;
}

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  weight: number; // Percentage of total portfolio
  firstPurchaseDate: string;
  lastTransactionDate: string;
}

interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  commission: number;
  timestamp: string;
  notes?: string;
}

interface PortfolioSettings {
  commissionPerTrade: number;
  commissionPercentage: number;
  allowShortSelling: boolean;
  allowMarginTrading: boolean;
  riskFreeRate: number; // For Sharpe ratio calculation
  benchmarkSymbol: string; // Default comparison benchmark
}

interface PortfolioAnalytics {
  beta: number;
  alpha: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  valueAtRisk95: number;
  correlationMatrix: CorrelationData[];
  sectorAllocation: SectorAllocation[];
  performanceHistory: PerformanceDataPoint[];
}

interface PerformanceDataPoint {
  date: string;
  portfolioValue: number;
  cashValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  benchmarkValue?: number;
}

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  change: number;
  changePercentage: number;
}

interface CorrelationData {
  symbol1: string;
  symbol2: string;
  correlation: number;
}
```

### Portfolio Manager Component
```typescript
interface PortfolioManagerProps {
  initialView?: 'list' | 'detail';
  selectedPortfolioId?: string;
}

const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  initialView = 'list',
  selectedPortfolioId,
}) => {
  const [view, setView] = useState<'list' | 'detail'>(initialView);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(
    selectedPortfolioId || null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    portfolios,
    loading,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    executeTransaction,
  } = usePortfolioStore();

  const handleCreatePortfolio = async (data: CreatePortfolioData) => {
    try {
      const newPortfolio = await createPortfolio(data);
      setSelectedPortfolio(newPortfolio.id);
      setView('detail');
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Handle error
    }
  };

  const handlePortfolioSelect = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId);
    setView('detail');
  };

  const calculateTotalPortfolioValue = () => {
    return portfolios.reduce((total, p) => total + p.totalValue, 0);
  };

  return (
    <div className="portfolio-manager">
      <div className="portfolio-header">
        <div className="header-content">
          <h1>Portfolio Simulation</h1>
          <div className="portfolio-summary">
            <div className="summary-item">
              <span className="label">Total Portfolios</span>
              <span className="value">{portfolios.length}</span>
            </div>
            <div className="summary-item">
              <span className="label">Combined Value</span>
              <span className="value">
                ${calculateTotalPortfolioValue().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="primary"
          >
            Create Portfolio
          </button>
        </div>
      </div>

      <div className="portfolio-content">
        {view === 'list' ? (
          <PortfolioList
            portfolios={portfolios}
            onPortfolioSelect={handlePortfolioSelect}
            onPortfolioUpdate={updatePortfolio}
            onPortfolioDelete={deletePortfolio}
          />
        ) : (
          <PortfolioDetail
            portfolioId={selectedPortfolio!}
            onBack={() => setView('list')}
          />
        )}
      </div>

      <PortfolioCreator
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreatePortfolio}
      />
    </div>
  );
};
```

### Trading Interface Component
```typescript
interface TradingInterfaceProps {
  portfolioId: string;
  symbol?: string;
  defaultAction?: 'BUY' | 'SELL';
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({
  portfolioId,
  symbol: initialSymbol = '',
  defaultAction = 'BUY',
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [action, setAction] = useState<'BUY' | 'SELL'>(defaultAction);
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { portfolio, executeTransaction } = usePortfolioDetail(portfolioId);
  const { data: stockData, isLoading: stockLoading } = useStockPrice(symbol);

  const currentHolding = portfolio?.holdings.find(h => h.symbol === symbol);
  const maxSellQuantity = currentHolding?.quantity || 0;
  const currentPrice = stockData?.currentPrice || 0;
  const totalAmount = parseFloat(quantity) * currentPrice;
  const commission = portfolio?.settings.commissionPerTrade || 0;
  const netAmount = action === 'BUY' 
    ? totalAmount + commission 
    : totalAmount - commission;

  const canExecute = () => {
    if (!symbol || !quantity || parseFloat(quantity) <= 0) return false;
    if (!currentPrice) return false;
    
    if (action === 'BUY') {
      return portfolio && portfolio.currentCash >= netAmount;
    } else {
      return parseFloat(quantity) <= maxSellQuantity;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canExecute()) return;

    setIsSubmitting(true);
    try {
      await executeTransaction({
        portfolioId,
        symbol,
        type: action,
        quantity: parseFloat(quantity),
        price: currentPrice,
        notes: notes.trim() || undefined,
      });
      
      // Reset form
      setQuantity('');
      setNotes('');
      
      // Show success message
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="trading-interface">
      <div className="trading-header">
        <h3>Trade Stocks</h3>
        <div className="action-toggle">
          <button
            className={action === 'BUY' ? 'active buy' : 'buy'}
            onClick={() => setAction('BUY')}
          >
            Buy
          </button>
          <button
            className={action === 'SELL' ? 'active sell' : 'sell'}
            onClick={() => setAction('SELL')}
          >
            Sell
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="trading-form">
        <div className="form-group">
          <label htmlFor="symbol">Stock Symbol</label>
          <StockSearchInput
            value={symbol}
            onChange={setSymbol}
            placeholder="Enter symbol (e.g., AAPL)"
          />
        </div>

        {symbol && stockData && (
          <div className="stock-info">
            <div className="stock-name">{stockData.name}</div>
            <div className="stock-price">
              ${currentPrice.toFixed(2)}
              <PriceChange change={stockData.priceChange} size="small" />
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="quantity">
            Quantity
            {action === 'SELL' && currentHolding && (
              <span className="available">
                ({maxSellQuantity} available)
              </span>
            )}
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            max={action === 'SELL' ? maxSellQuantity : undefined}
            step="1"
            placeholder="Number of shares"
          />
          {action === 'SELL' && currentHolding && (
            <div className="quick-quantity">
              <button
                type="button"
                onClick={() => setQuantity(Math.floor(maxSellQuantity * 0.25).toString())}
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setQuantity(Math.floor(maxSellQuantity * 0.5).toString())}
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setQuantity(Math.floor(maxSellQuantity * 0.75).toString())}
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setQuantity(maxSellQuantity.toString())}
              >
                All
              </button>
            </div>
          )}
        </div>

        {quantity && currentPrice && (
          <div className="order-summary">
            <div className="summary-row">
              <span>Shares</span>
              <span>{quantity}</span>
            </div>
            <div className="summary-row">
              <span>Price per share</span>
              <span>${currentPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            {commission > 0 && (
              <div className="summary-row">
                <span>Commission</span>
                <span>${commission.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total {action === 'BUY' ? 'Cost' : 'Proceeds'}</span>
              <span className={action === 'BUY' ? 'cost' : 'proceeds'}>
                ${netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note about this trade..."
            rows={2}
          />
        </div>

        <div className="portfolio-cash">
          <span>Available Cash: ${portfolio?.currentCash.toLocaleString()}</span>
          {action === 'BUY' && netAmount > (portfolio?.currentCash || 0) && (
            <span className="insufficient-funds">Insufficient funds</span>
          )}
        </div>

        <button
          type="submit"
          disabled={!canExecute() || isSubmitting || stockLoading}
          className={`trade-button ${action.toLowerCase()}`}
        >
          {isSubmitting ? 'Processing...' : `${action} ${quantity || '0'} Shares`}
        </button>
      </form>
    </div>
  );
};
```

### Portfolio Analytics Component
```typescript
interface PortfolioAnalyticsProps {
  portfolio: Portfolio;
  benchmark?: string;
}

const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({
  portfolio,
  benchmark = 'SPY',
}) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1Y');
  const [analyticsData, setAnalyticsData] = useState<PortfolioAnalytics | null>(null);

  const { data: benchmarkData } = useBenchmarkData(benchmark, timeRange);

  useEffect(() => {
    const calculateAnalytics = async () => {
      try {
        const analytics = await portfolioApi.calculateAnalytics(
          portfolio.id,
          timeRange
        );
        setAnalyticsData(analytics);
      } catch (error) {
        console.error('Failed to calculate analytics:', error);
      }
    };

    calculateAnalytics();
  }, [portfolio.id, timeRange]);

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  };

  const formatRatio = (value: number) => {
    return value.toFixed(3);
  };

  return (
    <div className="portfolio-analytics">
      <div className="analytics-header">
        <h3>Performance Analytics</h3>
        <div className="time-range-selector">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
            <button
              key={range}
              className={timeRange === range ? 'active' : ''}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        {/* Performance Metrics */}
        <div className="analytics-section">
          <h4>Returns</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Total Return</span>
              <span className={`metric-value ${portfolio.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                ${portfolio.totalReturn.toLocaleString()}
              </span>
              <span className="metric-percentage">
                {formatPercentage(portfolio.totalReturnPercentage)}
              </span>
            </div>
            
            <div className="metric-item">
              <span className="metric-label">Today's Change</span>
              <span className={`metric-value ${portfolio.dayChange >= 0 ? 'positive' : 'negative'}`}>
                ${portfolio.dayChange.toLocaleString()}
              </span>
              <span className="metric-percentage">
                {formatPercentage(portfolio.dayChangePercentage)}
              </span>
            </div>

            {analyticsData && (
              <>
                <div className="metric-item">
                  <span className="metric-label">Alpha</span>
                  <span className={`metric-value ${analyticsData.alpha >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercentage(analyticsData.alpha)}
                  </span>
                </div>

                <div className="metric-item">
                  <span className="metric-label">Beta</span>
                  <span className="metric-value">
                    {formatRatio(analyticsData.beta)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Risk Metrics */}
        {analyticsData && (
          <div className="analytics-section">
            <h4>Risk Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Sharpe Ratio</span>
                <span className="metric-value">
                  {formatRatio(analyticsData.sharpeRatio)}
                </span>
              </div>
              
              <div className="metric-item">
                <span className="metric-label">Volatility</span>
                <span className="metric-value">
                  {formatPercentage(analyticsData.volatility)}
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-label">Max Drawdown</span>
                <span className="metric-value negative">
                  {formatPercentage(analyticsData.maxDrawdown)}
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-label">VaR (95%)</span>
                <span className="metric-value negative">
                  ${analyticsData.valueAtRisk95.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Asset Allocation */}
        <div className="analytics-section full-width">
          <h4>Asset Allocation</h4>
          <AssetAllocationChart holdings={portfolio.holdings} />
        </div>

        {/* Sector Diversification */}
        {analyticsData && (
          <div className="analytics-section full-width">
            <h4>Sector Diversification</h4>
            <SectorAllocationChart sectors={analyticsData.sectorAllocation} />
          </div>
        )}

        {/* Performance Chart */}
        <div className="analytics-section full-width">
          <h4>Performance vs Benchmark</h4>
          <PerformanceChart
            portfolioData={analyticsData?.performanceHistory || []}
            benchmarkData={benchmarkData}
            timeRange={timeRange}
          />
        </div>

        {/* Correlation Matrix */}
        {analyticsData && analyticsData.correlationMatrix.length > 0 && (
          <div className="analytics-section full-width">
            <h4>Holdings Correlation</h4>
            <CorrelationMatrix correlations={analyticsData.correlationMatrix} />
          </div>
        )}
      </div>
    </div>
  );
};
```

## State Management

### Portfolio Store
```typescript
interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolio: string | null;
  loading: boolean;
  error: string | null;
}

const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  activePortfolio: null,
  loading: false,
  error: null,

  // Actions
  loadPortfolios: async () => {
    set({ loading: true, error: null });
    try {
      const portfolios = await portfolioApi.getPortfolios();
      set({ portfolios, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createPortfolio: async (data: CreatePortfolioData) => {
    try {
      const newPortfolio = await portfolioApi.createPortfolio(data);
      set(state => ({
        portfolios: [...state.portfolios, newPortfolio]
      }));
      return newPortfolio;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updatePortfolio: async (id: string, updates: Partial<Portfolio>) => {
    try {
      const updatedPortfolio = await portfolioApi.updatePortfolio(id, updates);
      set(state => ({
        portfolios: state.portfolios.map(p => 
          p.id === id ? updatedPortfolio : p
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deletePortfolio: async (id: string) => {
    try {
      await portfolioApi.deletePortfolio(id);
      set(state => ({
        portfolios: state.portfolios.filter(p => p.id !== id),
        activePortfolio: state.activePortfolio === id ? null : state.activePortfolio
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  executeTransaction: async (transaction: TransactionRequest) => {
    try {
      const updatedPortfolio = await portfolioApi.executeTransaction(transaction);
      
      // Optimistically update the portfolio
      set(state => ({
        portfolios: state.portfolios.map(p => 
          p.id === transaction.portfolioId ? updatedPortfolio : p
        )
      }));
      
      return updatedPortfolio;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  recalculatePortfolio: async (portfolioId: string) => {
    try {
      const recalculatedPortfolio = await portfolioApi.recalculatePortfolio(portfolioId);
      set(state => ({
        portfolios: state.portfolios.map(p => 
          p.id === portfolioId ? recalculatedPortfolio : p
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

## API Endpoints

### Portfolio Management API
```typescript
// GET /api/portfolios
interface GetPortfoliosResponse {
  portfolios: Portfolio[];
  total: number;
}

// POST /api/portfolios
interface CreatePortfolioRequest {
  name: string;
  description?: string;
  startingCash: number;
  settings?: Partial<PortfolioSettings>;
}

// PUT /api/portfolios/{id}
interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  settings?: Partial<PortfolioSettings>;
}

// DELETE /api/portfolios/{id}
// Returns 204 No Content

// POST /api/portfolios/{id}/transactions
interface TransactionRequest {
  portfolioId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price?: number; // Use current market price if not specified
  notes?: string;
}

interface TransactionResponse {
  transaction: Transaction;
  portfolio: Portfolio;
}

// GET /api/portfolios/{id}/transactions
interface GetTransactionsResponse {
  transactions: Transaction[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// GET /api/portfolios/{id}/analytics
interface GetAnalyticsRequest {
  timeRange?: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  benchmark?: string;
}

interface GetAnalyticsResponse {
  analytics: PortfolioAnalytics;
  benchmark?: {
    symbol: string;
    performance: PerformanceDataPoint[];
  };
}

// POST /api/portfolios/{id}/recalculate
// Recalculates portfolio values with latest prices
interface RecalculateResponse {
  portfolio: Portfolio;
  updatedAt: string;
}

// GET /api/portfolios/{id}/export
// Export portfolio data as CSV/JSON
interface ExportPortfolioRequest {
  format: 'csv' | 'json';
  includeTransactions?: boolean;
  includeAnalytics?: boolean;
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('Portfolio Simulation', () => {
  describe('TradingInterface', () => {
    const mockPortfolio = {
      id: '1',
      currentCash: 50000,
      holdings: [
        { symbol: 'AAPL', quantity: 10, avgCost: 150 }
      ]
    };

    test('calculates buy order correctly', () => {
      render(<TradingInterface portfolioId="1" />);
      
      fireEvent.change(screen.getByLabelText('Stock Symbol'), {
        target: { value: 'AAPL' }
      });
      fireEvent.change(screen.getByLabelText('Quantity'), {
        target: { value: '5' }
      });

      // Mock current price at $160
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText('$800.00')).toBeInTheDocument();
    });

    test('prevents selling more shares than owned', () => {
      render(<TradingInterface portfolioId="1" defaultAction="SELL" />);
      
      fireEvent.change(screen.getByLabelText('Stock Symbol'), {
        target: { value: 'AAPL' }
      });
      fireEvent.change(screen.getByLabelText('Quantity'), {
        target: { value: '15' }
      });

      const sellButton = screen.getByRole('button', { name: /sell/i });
      expect(sellButton).toBeDisabled();
    });

    test('shows insufficient funds warning', () => {
      const poorPortfolio = { ...mockPortfolio, currentCash: 100 };
      
      render(<TradingInterface portfolioId="1" />);
      
      fireEvent.change(screen.getByLabelText('Quantity'), {
        target: { value: '100' }
      });

      expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    });
  });

  describe('Portfolio Analytics', () => {
    test('calculates portfolio return correctly', () => {
      const portfolio = {
        startingCash: 100000,
        totalValue: 110000,
        totalReturn: 10000,
        totalReturnPercentage: 0.10
      };

      render(<PortfolioAnalytics portfolio={portfolio} />);

      expect(screen.getByText('$10,000')).toBeInTheDocument();
      expect(screen.getByText('+10.00%')).toBeInTheDocument();
    });

    test('displays risk metrics', async () => {
      const analyticsData = {
        sharpeRatio: 1.25,
        beta: 1.1,
        volatility: 0.15,
        maxDrawdown: -0.08
      };

      render(<PortfolioAnalytics portfolio={mockPortfolio} />);

      await waitFor(() => {
        expect(screen.getByText('1.250')).toBeInTheDocument(); // Sharpe ratio
        expect(screen.getByText('1.100')).toBeInTheDocument(); // Beta
        expect(screen.getByText('+15.00%')).toBeInTheDocument(); // Volatility
        expect(screen.getByText('-8.00%')).toBeInTheDocument(); // Max drawdown
      });
    });
  });

  describe('Transaction History', () => {
    test('displays transaction list', () => {
      const transactions = [
        {
          id: '1',
          symbol: 'AAPL',
          type: 'BUY',
          quantity: 10,
          price: 150,
          timestamp: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          symbol: 'AAPL',
          type: 'SELL',
          quantity: 5,
          price: 160,
          timestamp: '2024-01-16T14:30:00Z'
        }
      ];

      render(<OrderHistory transactions={transactions} />);

      expect(screen.getByText('BUY 10 AAPL @ $150.00')).toBeInTheDocument();
      expect(screen.getByText('SELL 5 AAPL @ $160.00')).toBeInTheDocument();
    });

    test('filters transactions by symbol', () => {
      render(<OrderHistory transactions={mockTransactions} />);
      
      fireEvent.change(screen.getByLabelText('Filter by symbol'), {
        target: { value: 'AAPL' }
      });

      expect(screen.getAllByText(/AAPL/)).toHaveLength(2);
      expect(screen.queryByText(/MSFT/)).not.toBeInTheDocument();
    });
  });
});
```

### Integration Tests
```typescript
describe('Portfolio Integration', () => {
  test('complete trading workflow', async () => {
    render(<PortfolioManager />);
    
    // Create portfolio
    fireEvent.click(screen.getByText('Create Portfolio'));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Portfolio' }
    });
    fireEvent.change(screen.getByLabelText('Starting Cash'), {
      target: { value: '100000' }
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Test Portfolio')).toBeInTheDocument();
    });

    // Execute buy order
    fireEvent.click(screen.getByText('Trade'));
    fireEvent.change(screen.getByLabelText('Stock Symbol'), {
      target: { value: 'AAPL' }
    });
    fireEvent.change(screen.getByLabelText('Quantity'), {
      target: { value: '10' }
    });
    fireEvent.click(screen.getByText('BUY 10 Shares'));

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('10 shares')).toBeInTheDocument();
    });

    // Execute sell order
    fireEvent.click(screen.getByText('Sell'));
    fireEvent.change(screen.getByLabelText('Quantity'), {
      target: { value: '5' }
    });
    fireEvent.click(screen.getByText('SELL 5 Shares'));

    await waitFor(() => {
      expect(screen.getByText('5 shares')).toBeInTheDocument();
    });
  });

  test('portfolio performance tracking', async () => {
    render(<PortfolioDetail portfolioId="test-portfolio" />);
    
    // Mock price updates
    await act(async () => {
      // Simulate price changes
      mockPriceUpdate('AAPL', 155); // 5% gain
    });

    await waitFor(() => {
      expect(screen.getByText('+5.00%')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimizations

### Real-time Updates with WebSocket
```typescript
const usePortfolioRealtimeUpdates = (portfolioId: string) => {
  const { updatePortfolio } = usePortfolioStore();

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/portfolio/${portfolioId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      if (update.type === 'PRICE_UPDATE') {
        updatePortfolio(portfolioId, {
          holdings: update.holdings,
          totalValue: update.totalValue,
          dayChange: update.dayChange,
          dayChangePercentage: update.dayChangePercentage,
        });
      }
    };

    return () => ws.close();
  }, [portfolioId, updatePortfolio]);
};
```

### Memoized Calculations
```typescript
const usePortfolioMetrics = (portfolio: Portfolio) => {
  return useMemo(() => ({
    totalReturn: portfolio.totalValue - portfolio.startingCash,
    totalReturnPercentage: 
      (portfolio.totalValue - portfolio.startingCash) / portfolio.startingCash,
    cashPercentage: portfolio.currentCash / portfolio.totalValue,
    equityPercentage: 
      (portfolio.totalValue - portfolio.currentCash) / portfolio.totalValue,
  }), [portfolio]);
};
```

### Efficient Chart Rendering
```typescript
const PortfolioChart = React.memo(({ data, timeRange }) => {
  const chartData = useMemo(() => {
    return data.filter(point => {
      const pointDate = new Date(point.date);
      const cutoffDate = getTimeRangeCutoff(timeRange);
      return pointDate >= cutoffDate;
    });
  }, [data, timeRange]);

  return <LineChart data={chartData} />;
});
```

## Future Enhancements

### Phase 2 Features
- [ ] **Options Trading**: Simulate options contracts (calls/puts)
- [ ] **Margin Trading**: Allow leveraged positions with interest calculations
- [ ] **Short Selling**: Enable short positions with borrowing costs
- [ ] **Dividend Tracking**: Automatic dividend payments and reinvestment
- [ ] **Tax Simulation**: Capital gains/losses tracking for tax planning

### Advanced Features
- [ ] **Strategy Backtesting**: Test strategies against historical data
- [ ] **Paper Trading Competitions**: Compete with other users
- [ ] **AI Portfolio Advisor**: ML-powered portfolio optimization suggestions
- [ ] **Social Features**: Share portfolios and follow successful traders
- [ ] **Mobile App**: Native mobile app with notifications

### Professional Features
- [ ] **Multi-Asset Support**: Bonds, ETFs, mutual funds, crypto
- [ ] **Currency Trading**: Forex simulation
- [ ] **Sector Rotation**: Automated sector-based rebalancing
- [ ] **Risk Management**: Stop-losses, take-profits, position sizing
- [ ] **Advanced Analytics**: Factor analysis, attribution analysis

---

**Dependencies**: Stories 1.2 (API Endpoints), 3.2 (Stock Cards), Real-time price data  
**Blockers**: None  
**Definition of Done**: All acceptance criteria met, trading simulation functional, analytics accurate, performance tracking working, responsive design, comprehensive test coverage
