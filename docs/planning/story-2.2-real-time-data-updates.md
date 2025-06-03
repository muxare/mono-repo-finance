# Story 2.2: Real-time Data Updates

## 📋 Story Overview
**As a** active trader  
**I want** real-time price updates and live charts  
**So that** I can make timely trading decisions based on current market data

---

## 🎯 Acceptance Criteria

### Real-time Features
- [ ] Live price updates with sub-second latency
- [ ] Real-time chart data streaming without page refresh
- [ ] WebSocket connection with automatic reconnection
- [ ] Price alerts and notifications
- [ ] Connection status indicator

### Data Integrity
- [ ] Seamless transition between historical and live data
- [ ] Data validation and error recovery
- [ ] Buffering during connection issues
- [ ] Duplicate data prevention
- [ ] Timestamp synchronization

### Performance Requirements
- [ ] Handle 100+ concurrent connections
- [ ] Sub-500ms update latency
- [ ] Graceful degradation during high load
- [ ] Memory-efficient data streaming
- [ ] Battery-friendly mobile implementation

---

## 🛠️ Technical Implementation

### 1. WebSocket Hub (Server-Side)
```csharp
// File: Hubs/MarketDataHub.cs
using Microsoft.AspNetCore.SignalR;

[Authorize]
public class MarketDataHub : Hub
{
    private readonly IMarketDataService _marketDataService;
    private readonly ILogger<MarketDataHub> _logger;

    public MarketDataHub(IMarketDataService marketDataService, ILogger<MarketDataHub> logger)
    {
        _marketDataService = marketDataService;
        _logger = logger;
    }

    public async Task SubscribeToSymbol(string symbol)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"stock_{symbol}");
        _logger.LogInformation($"Client {Context.ConnectionId} subscribed to {symbol}");
        
        // Send current price immediately
        var currentPrice = await _marketDataService.GetCurrentPriceAsync(symbol);
        await Clients.Caller.SendAsync("PriceUpdate", new PriceUpdateDto
        {
            Symbol = symbol,
            Price = currentPrice.Close,
            Change = currentPrice.Change,
            ChangePercent = currentPrice.ChangePercent,
            Volume = currentPrice.Volume,
            Timestamp = currentPrice.Timestamp
        });
    }

    public async Task UnsubscribeFromSymbol(string symbol)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"stock_{symbol}");
        _logger.LogInformation($"Client {Context.ConnectionId} unsubscribed from {symbol}");
    }

    public override async Task OnDisconnectedAsync(Exception exception)
    {
        _logger.LogInformation($"Client {Context.ConnectionId} disconnected");
        await base.OnDisconnectedAsync(exception);
    }
}
```

### 2. Market Data Service
```csharp
// File: Services/IMarketDataService.cs
public interface IMarketDataService
{
    Task<CurrentPrice> GetCurrentPriceAsync(string symbol);
    Task StartRealTimeUpdatesAsync();
    Task StopRealTimeUpdatesAsync();
    event EventHandler<PriceUpdateEventArgs> PriceUpdated;
}

// File: Services/MarketDataService.cs
public class MarketDataService : IMarketDataService, IHostedService
{
    private readonly IHubContext<MarketDataHub> _hubContext;
    private readonly IStockPriceRepository _stockPriceRepository;
    private readonly ILogger<MarketDataService> _logger;
    private Timer _updateTimer;

    public event EventHandler<PriceUpdateEventArgs> PriceUpdated;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting market data service");
        
        // Start timer for simulated real-time updates
        _updateTimer = new Timer(async _ => await BroadcastPriceUpdates(), 
                                null, TimeSpan.Zero, TimeSpan.FromSeconds(1));
    }

    private async Task BroadcastPriceUpdates()
    {
        try
        {
            var activeSymbols = await GetActiveSymbolsAsync();
            
            foreach (var symbol in activeSymbols)
            {
                var priceUpdate = await GenerateSimulatedPriceUpdate(symbol);
                
                await _hubContext.Clients.Group($"stock_{symbol}")
                    .SendAsync("PriceUpdate", priceUpdate);
                
                PriceUpdated?.Invoke(this, new PriceUpdateEventArgs(priceUpdate));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting price updates");
        }
    }

    private async Task<PriceUpdateDto> GenerateSimulatedPriceUpdate(string symbol)
    {
        // Simulate realistic price movements based on historical data
        var lastPrice = await _stockPriceRepository.GetLatestPriceAsync(symbol);
        var random = new Random();
        var volatility = 0.001; // 0.1% max change per second
        
        var changePercent = (random.NextDouble() - 0.5) * 2 * volatility;
        var newPrice = lastPrice.Close * (1 + changePercent);
        
        return new PriceUpdateDto
        {
            Symbol = symbol,
            Price = Math.Round(newPrice, 2),
            Change = Math.Round(newPrice - lastPrice.Close, 2),
            ChangePercent = Math.Round(changePercent * 100, 2),
            Volume = random.Next(1000, 10000),
            Timestamp = DateTimeOffset.UtcNow
        };
    }
}
```

### 3. Client-Side WebSocket Management
```typescript
// File: services/WebSocketService.ts
export class WebSocketService {
  private connection: HubConnection | null = null;
  private subscriptions = new Set<string>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private apiUrl: string) {}

  async connect(): Promise<void> {
    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(`${this.apiUrl}/hubs/marketdata`, {
          accessTokenFactory: () => this.getAuthToken()
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      this.setupEventHandlers();
      await this.connection.start();
      
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
      
      // Resubscribe to all symbols after reconnection
      await this.resubscribeAll();
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('PriceUpdate', (update: PriceUpdateDto) => {
      this.handlePriceUpdate(update);
    });

    this.connection.onreconnecting(() => {
      console.log('WebSocket reconnecting...');
      this.notifyConnectionStatus('reconnecting');
    });

    this.connection.onreconnected(() => {
      console.log('WebSocket reconnected');
      this.notifyConnectionStatus('connected');
      this.resubscribeAll();
    });

    this.connection.onclose(() => {
      console.log('WebSocket connection closed');
      this.notifyConnectionStatus('disconnected');
    });
  }

  async subscribeToSymbol(symbol: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      await this.connection.invoke('SubscribeToSymbol', symbol);
      this.subscriptions.add(symbol);
      console.log(`Subscribed to ${symbol}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${symbol}:`, error);
      throw error;
    }
  }

  async unsubscribeFromSymbol(symbol: string): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.invoke('UnsubscribeFromSymbol', symbol);
      this.subscriptions.delete(symbol);
      console.log(`Unsubscribed from ${symbol}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from ${symbol}:`, error);
    }
  }

  private async resubscribeAll(): Promise<void> {
    for (const symbol of this.subscriptions) {
      try {
        await this.connection?.invoke('SubscribeToSymbol', symbol);
      } catch (error) {
        console.error(`Failed to resubscribe to ${symbol}:`, error);
      }
    }
  }

  private handlePriceUpdate(update: PriceUpdateDto): void {
    // Emit event to subscribers
    this.emit('priceUpdate', update);
    
    // Update chart data if chart is active for this symbol
    this.updateChartData(update);
  }

  disconnect(): void {
    this.connection?.stop();
    this.subscriptions.clear();
  }

  getConnectionState(): HubConnectionState | null {
    return this.connection?.state ?? null;
  }
}
```

### 4. React Hook for Real-time Data
```typescript
// File: hooks/useRealTimePrice.ts
interface UseRealTimePriceOptions {
  symbol: string;
  enabled?: boolean;
}

export const useRealTimePrice = ({ symbol, enabled = true }: UseRealTimePriceOptions) => {
  const [currentPrice, setCurrentPrice] = useState<PriceUpdateDto | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const webSocketService = useWebSocketService();

  useEffect(() => {
    if (!enabled || !symbol) return;

    const handlePriceUpdate = (update: PriceUpdateDto) => {
      if (update.symbol === symbol) {
        setCurrentPrice(update);
        setError(null);
      }
    };

    const handleConnectionStatus = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      if (status === 'disconnected') {
        setError('Connection lost');
      } else if (status === 'connected') {
        setError(null);
      }
    };

    // Subscribe to events
    webSocketService.on('priceUpdate', handlePriceUpdate);
    webSocketService.on('connectionStatus', handleConnectionStatus);

    // Subscribe to symbol
    const subscribe = async () => {
      try {
        await webSocketService.subscribeToSymbol(symbol);
      } catch (err) {
        setError(`Failed to subscribe to ${symbol}`);
      }
    };

    subscribe();

    return () => {
      webSocketService.off('priceUpdate', handlePriceUpdate);
      webSocketService.off('connectionStatus', handleConnectionStatus);
      webSocketService.unsubscribeFromSymbol(symbol);
    };
  }, [symbol, enabled, webSocketService]);

  return {
    currentPrice,
    connectionStatus,
    error,
    isConnected: connectionStatus === 'connected',
    isReconnecting: connectionStatus === 'reconnecting'
  };
};
```

### 5. Live Chart Integration
```typescript
// File: components/Chart/LiveCandlestickChart.tsx
export const LiveCandlestickChart: React.FC<LiveChartProps> = ({
  symbol,
  isLive = false,
  ...chartProps
}) => {
  const { currentPrice, isConnected } = useRealTimePrice({ 
    symbol, 
    enabled: isLive 
  });
  
  const chartRef = useRef<ChartService | null>(null);
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);

  // Update chart with real-time data
  useEffect(() => {
    if (!currentPrice || !chartRef.current || !isLive) return;

    const newDataPoint: CandlestickData = {
      time: Math.floor(currentPrice.timestamp.getTime() / 1000),
      open: currentPrice.price, // Simplified - in reality, manage OHLC properly
      high: currentPrice.price,
      low: currentPrice.price,
      close: currentPrice.price,
      volume: currentPrice.volume
    };

    chartRef.current.updateData(newDataPoint);
  }, [currentPrice, isLive]);

  return (
    <div className="live-chart-container">
      <div className="chart-header">
        <div className="symbol-info">
          <h3>{symbol}</h3>
          {currentPrice && (
            <div className={`price ${currentPrice.change >= 0 ? 'positive' : 'negative'}`}>
              <span className="current-price">${currentPrice.price}</span>
              <span className="change">
                {currentPrice.change >= 0 ? '+' : ''}
                {currentPrice.change} ({currentPrice.changePercent}%)
              </span>
            </div>
          )}
        </div>
        
        <div className="connection-status">
          <ConnectionIndicator status={isConnected ? 'connected' : 'disconnected'} />
          {isLive && <span className="live-badge">LIVE</span>}
        </div>
      </div>
      
      <CandlestickChart 
        ref={chartRef}
        symbol={symbol}
        data={historicalData}
        {...chartProps}
      />
    </div>
  );
};
```

---

## 📁 File Structure
```
Apps/Api/
├── Hubs/
│   └── MarketDataHub.cs
├── Services/
│   ├── IMarketDataService.cs
│   ├── MarketDataService.cs
│   └── PriceSimulationService.cs
├── Models/
│   ├── PriceUpdateDto.cs
│   └── CurrentPrice.cs
└── Configuration/
    └── SignalRConfiguration.cs

apps/web/src/
├── services/
│   ├── WebSocketService.ts
│   └── RealTimeDataService.ts
├── hooks/
│   ├── useRealTimePrice.ts
│   ├── useWebSocketService.ts
│   └── useMarketStatus.ts
├── components/
│   ├── Chart/
│   │   └── LiveCandlestickChart.tsx
│   ├── UI/
│   │   ├── ConnectionIndicator.tsx
│   │   └── LiveBadge.tsx
└── types/
    └── RealTimeTypes.ts
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] WebSocket connection handling
- [ ] Price update processing
- [ ] Error recovery mechanisms
- [ ] Data validation and filtering

### Integration Tests
- [ ] End-to-end real-time flow
- [ ] SignalR hub functionality
- [ ] Chart data updates
- [ ] Connection resilience

### Load Tests
- [ ] 100+ concurrent connections
- [ ] High-frequency price updates
- [ ] Memory usage under load
- [ ] Connection recovery time

### Manual Tests
- [ ] Network disconnection scenarios
- [ ] Browser tab switching
- [ ] Mobile background/foreground

---

## 🚀 Implementation Phases

### Phase 1: Basic WebSocket Setup (Week 1)
- [ ] Configure SignalR on server
- [ ] Create basic WebSocket service
- [ ] Implement connection management
- [ ] Add simple price broadcasting

### Phase 2: Enhanced Features (Week 2)
- [ ] Add automatic reconnection
- [ ] Implement subscription management
- [ ] Create connection status indicators
- [ ] Add error handling and recovery

### Phase 3: Chart Integration (Week 3)
- [ ] Integrate with chart component
- [ ] Implement live data streaming
- [ ] Add smooth chart updates
- [ ] Create live/historical data transition

### Phase 4: Optimization (Week 4)
- [ ] Performance optimization
- [ ] Mobile-specific enhancements
- [ ] Battery usage optimization
- [ ] Advanced error recovery

---

## 📊 Configuration Options

### Server Configuration
```json
{
  "SignalR": {
    "MaximumReceiveMessageSize": 32768,
    "KeepAliveInterval": "00:00:15",
    "ClientTimeoutInterval": "00:00:30",
    "HandshakeTimeout": "00:00:15",
    "MaximumParallelInvocationsPerClient": 1
  },
  "MarketData": {
    "UpdateIntervalMs": 1000,
    "MaxActiveSymbols": 100,
    "SimulationMode": true,
    "MaxVolatility": 0.001
  }
}
```

### Client Configuration
```typescript
const webSocketConfig = {
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
  connectionTimeout: 15000,
  bufferSize: 100,
  enableLogging: true
};
```

---

## 📈 Performance Metrics
- Connection establishment: < 2 seconds
- Price update latency: < 500ms
- Memory usage: < 50MB for 50 symbols
- CPU usage: < 5% on modern devices
- 99.9% uptime with auto-reconnect

---

## 🛡️ Security & Rate Limiting
- [ ] JWT token authentication for WebSocket
- [ ] Rate limiting per connection (max 10 symbols)
- [ ] Input validation for all messages
- [ ] Connection flood protection
- [ ] Subscription abuse prevention

---

## 🔗 Dependencies
- **Prerequisites**: Story 1.2 (API Endpoints) for data access
- **Integration**: Story 2.1 (Charts) for visual updates
- **Related**: Story 4.1 (Alerts) for price notifications
