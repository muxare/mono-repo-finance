# Story 5.1: Real-time Price Updates

## Story Overview
**As a** user  
**I want** real-time price updates on charts and stock lists  
**So that** I can see current market conditions and make timely trading decisions

## Epic
Epic 5: Real-time Data & Performance

## Priority
High

## Story Points
13

## Dependencies
- Story 1.2: Financial Data API Endpoints (for price data structure)
- Story 2.1: Candlestick Chart Component (for chart updates)
- Story 3.1: Stock Search & Symbol Management (for stock list updates)

---

## Acceptance Criteria

### AC 5.1.1: WebSocket Connection Management
**Given** I am using the application  
**When** I load any page with stock data  
**Then** a WebSocket connection should be established automatically  
**And** I should see a connection status indicator  
**And** the connection should retry automatically if disconnected  
**And** I should be notified of connection status changes

### AC 5.1.2: Real-time Chart Updates
**Given** I am viewing a candlestick chart  
**When** new price data is received  
**Then** the chart should update smoothly without full refresh  
**And** the current price should be highlighted  
**And** volume data should update simultaneously  
**And** the update should not disrupt my current chart zoom/pan state

### AC 5.1.3: Live Stock List Updates
**Given** I am viewing a stock list or watchlist  
**When** price updates are received  
**Then** stock prices should update in real-time  
**And** price change indicators should reflect current changes  
**And** percentage changes should be calculated accurately  
**And** price changes should be visually highlighted (flash effect)

### AC 5.1.4: Configurable Update Intervals
**Given** I am in the application settings  
**When** I configure real-time update preferences  
**Then** I should be able to set update intervals (1s, 5s, 15s, 30s)  
**And** I should be able to enable/disable real-time updates  
**And** I should be able to select which data types to update (price, volume, indicators)  
**And** settings should persist across sessions

### AC 5.1.5: Bandwidth-Optimized Updates
**Given** real-time updates are enabled  
**When** I have multiple charts/lists open  
**Then** updates should be batched and optimized for bandwidth  
**And** only visible components should receive updates  
**And** inactive tabs should pause updates automatically  
**And** updates should resume when tab becomes active

---

## Technical Implementation

### Phase 1: SignalR Hub Setup (Week 1)
**Objective**: Establish real-time communication infrastructure

**Tasks:**
- Create SignalR hub for price updates
- Implement connection management and authentication
- Add group management for stock subscriptions
- Create price update broadcasting service
- Add connection monitoring and logging

**Files to Create/Modify:**
```
apps/api/Api/Hubs/PriceUpdateHub.cs
apps/api/Api/Services/IPriceUpdateService.cs
apps/api/Api/Services/PriceUpdateService.cs
apps/api/Api/Models/RealTime/PriceUpdate.cs
apps/api/Api/Models/RealTime/ConnectionInfo.cs
apps/api/Api/Extensions/SignalRServiceExtensions.cs
apps/api/Program.cs (configure SignalR)
```

**SignalR Hub Methods:**
```csharp
public class PriceUpdateHub : Hub
{
    public async Task JoinStockGroup(string symbol)
    public async Task LeaveStockGroup(string symbol)
    public async Task GetConnectionInfo()
    public override async Task OnConnectedAsync()
    public override async Task OnDisconnectedAsync(Exception exception)
}
```

### Phase 2: Frontend WebSocket Client (Week 2)
**Objective**: Implement robust WebSocket client management

**Tasks:**
- Create SignalR client service with auto-reconnection
- Implement connection state management
- Add subscription management for stock symbols
- Create hooks for real-time data consumption
- Add connection status UI components

**Files to Create/Modify:**
```
apps/web/src/services/signalRService.ts
apps/web/src/hooks/useRealTimePrice.ts
apps/web/src/hooks/useSignalRConnection.ts
apps/web/src/contexts/RealTimeContext.tsx
apps/web/src/components/UI/ConnectionStatus.tsx
apps/web/src/utils/signalRUtils.ts
apps/web/src/types/realTime.ts
```

**Real-time Service Interface:**
```typescript
interface SignalRService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribeToStock(symbol: string): void
  unsubscribeFromStock(symbol: string): void
  onPriceUpdate(callback: (update: PriceUpdate) => void): void
  getConnectionState(): ConnectionState
}
```

### Phase 3: Chart Integration (Week 3)
**Objective**: Integrate real-time updates with existing chart components

**Tasks:**
- Update candlestick chart to handle real-time data
- Implement smooth chart animations for live updates
- Add current price line and indicators
- Optimize chart performance for frequent updates
- Add real-time volume updates

**Files to Create/Modify:**
```
apps/web/src/components/Charts/RealTimeCandlestickChart.tsx
apps/web/src/components/Charts/LivePriceLine.tsx
apps/web/src/hooks/useRealTimeChart.ts
apps/web/src/utils/chartUpdateUtils.ts
apps/web/src/components/Charts/VolumeChart.tsx
```

**Chart Update Features:**
- Smooth price line animation
- Real-time candle formation for current period
- Live volume bar updates
- Current price callout/tooltip
- Price change flash indicators

### Phase 4: List Updates & Performance (Week 4)
**Objective**: Implement efficient real-time updates for stock lists

**Tasks:**
- Add real-time updates to stock lists and watchlists
- Implement efficient DOM updates with React optimizations
- Add visual feedback for price changes (flash effects)
- Create price change indicators and animations
- Optimize for large lists with virtualization

**Files to Create/Modify:**
```
apps/web/src/components/Stocks/RealTimeStockList.tsx
apps/web/src/components/Stocks/RealTimeStockCard.tsx
apps/web/src/components/UI/PriceChangeIndicator.tsx
apps/web/src/hooks/useRealTimeList.ts
apps/web/src/utils/priceChangeAnimations.ts
```

**Performance Optimizations:**
- Memoized components with React.memo
- Debounced updates for rapid price changes
- Virtual scrolling for large lists
- Batch DOM updates using requestAnimationFrame
- Selective component re-rendering

---

## Data Flow Architecture

### Real-time Data Pipeline
```
Market Data Provider
        ↓
Price Update Service (Background Job)
        ↓
SignalR Hub (Server)
        ↓
WebSocket Connection
        ↓
SignalR Client (Browser)
        ↓
React Context/Hooks
        ↓
Chart/List Components
```

### Update Message Format
```typescript
interface PriceUpdate {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: Date
  marketState: 'PRE' | 'OPEN' | 'AFTER' | 'CLOSED'
}
```

### Subscription Management
```typescript
interface SubscriptionManager {
  activeSubscriptions: Set<string>
  subscribeToStock(symbol: string): void
  unsubscribeFromStock(symbol: string): void
  optimizeSubscriptions(): void
  getSubscriptionCount(): number
}
```

---

## UI/UX Design Specifications

### Connection Status Indicator
```
Connected:    🟢 Live
Connecting:   🟡 Connecting...
Disconnected: 🔴 Offline
Error:        ⚠️ Connection Error
```

### Price Change Animations
- **Price Increase**: Green flash with upward arrow
- **Price Decrease**: Red flash with downward arrow
- **Flash Duration**: 300ms fade-out animation
- **Price Highlight**: Bold text for 1 second after change

### Real-time Chart Features
```
┌─────────────────────────────────────┐
│ AAPL - $150.25 ↑ +2.15 (+1.45%)   │
│ 🟢 Live Updates ON                  │
├─────────────────────────────────────┤
│           📈 Chart Area             │
│      ┌─────────────────┐            │
│      │ Current: $150.25│ ←Live Line │
│      └─────────────────┘            │
│                                     │
│           📊 Volume                 │
└─────────────────────────────────────┘
```

### Settings Panel
```
Real-time Updates
├─ Enable Live Updates: [✓]
├─ Update Interval: [5 seconds ▼]
├─ Data Types:
│  ├─ Price Updates: [✓]
│  ├─ Volume Updates: [✓]
│  └─ Technical Indicators: [✓]
└─ Connection Settings:
   ├─ Auto-reconnect: [✓]
   └─ Bandwidth Optimization: [✓]
```

---

## Performance Considerations

### Optimization Strategies
- **Batched Updates**: Group multiple price updates into single DOM updates
- **Throttling**: Limit update frequency to 60fps for smooth animations
- **Memory Management**: Clean up subscriptions and event listeners
- **Selective Updates**: Only update visible components
- **Connection Pooling**: Reuse WebSocket connections across components

### Monitoring Metrics
- WebSocket connection uptime
- Message delivery latency
- Update frequency per symbol
- Client-side memory usage
- Render performance metrics

### Bandwidth Optimization
- **Delta Updates**: Send only changed values
- **Compression**: Use MessagePack for binary serialization
- **Batching**: Group updates by time windows
- **Subscription Management**: Automatically unsubscribe invisible symbols

---

## Error Handling & Resilience

### Connection Failures
```typescript
interface ConnectionManager {
  maxRetryAttempts: number
  retryDelay: number
  exponentialBackoff: boolean
  onConnectionLost(): void
  onReconnecting(): void
  onReconnected(): void
}
```

### Error Scenarios
- **Network Disconnection**: Auto-retry with exponential backoff
- **Server Overload**: Graceful degradation to polling
- **Invalid Data**: Data validation and error logging
- **Memory Leaks**: Automatic cleanup of subscriptions

### Fallback Strategies
- Switch to HTTP polling when WebSocket fails
- Cache last known prices for offline display
- Show staleness indicators for old data
- Provide manual refresh options

---

## Testing Strategy

### Unit Tests
- SignalR hub methods and connection management
- Price update processing and validation
- React hooks for real-time data
- Animation and UI update utilities

### Integration Tests
- End-to-end WebSocket communication
- Real-time chart updates
- Multiple concurrent connections
- Connection failure and recovery

### Performance Tests
- Load testing with 1000+ concurrent connections
- Memory leak detection over extended periods
- Update frequency stress testing
- Network interruption simulations

### E2E Tests
- Complete real-time trading workflow
- Multi-tab synchronization
- Mobile device compatibility
- Cross-browser WebSocket support

---

## Security Considerations

### WebSocket Security
- Authentication token validation for WebSocket connections
- Rate limiting for subscription requests
- Input validation for stock symbols
- DoS protection with connection limits

### Data Integrity
- Checksum validation for price updates
- Timestamp verification for data freshness
- Duplicate update detection and filtering
- Data sanitization for XSS prevention

---

## Deployment & Configuration

### Environment Variables
```
SIGNALR_CONNECTION_TIMEOUT=30000
SIGNALR_KEEP_ALIVE_INTERVAL=15000
REALTIME_UPDATE_INTERVAL=5000
MAX_CONCURRENT_CONNECTIONS=10000
ENABLE_MESSAGE_COMPRESSION=true
```

### Infrastructure Requirements
- Redis for SignalR scale-out (multiple server instances)
- Load balancer with sticky sessions for WebSocket support
- Monitoring for WebSocket connection metrics
- SSL/TLS termination for secure WebSocket connections

---

## Definition of Done

### Completion Criteria
- [ ] All acceptance criteria are met
- [ ] SignalR hub properly configured and tested
- [ ] Frontend WebSocket client handles all connection states
- [ ] Real-time chart updates work smoothly
- [ ] Stock list updates are optimized and performant
- [ ] Error handling and reconnection logic tested
- [ ] Performance benchmarks met (60fps updates)
- [ ] Security review completed
- [ ] Load testing passed
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Documentation updated

### Success Metrics
- WebSocket connection uptime >99.5%
- Price update latency <100ms
- UI update performance >50fps
- Memory usage growth <1MB/hour
- Successful reconnection rate >95%
