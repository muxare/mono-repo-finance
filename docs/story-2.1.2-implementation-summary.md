# Backend Request Infrastructure

This document provides comprehensive documentation for the backend request infrastructure implemented in Story 2.1.2.

## Overview

The backend request infrastructure provides a robust, industry-standard HTTP client system for the frontend application. It includes typed API services, request/response transformers, intelligent caching, real-time capabilities, and comprehensive error handling.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Application                     │
├─────────────────────────────────────────────────────────────────┤
│  React Query Hooks  │  Real-time Hooks  │  Context API         │
├─────────────────────────────────────────────────────────────────┤
│  FinancialDataService  │  RealTimeService  │  Query Client      │
├─────────────────────────────────────────────────────────────────┤
│  ApiClient (Axios)     │  SignalRClient    │  Transformers      │
├─────────────────────────────────────────────────────────────────┤
│                        Backend API (C#/.NET)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. ApiClient (`src/services/api/ApiClient.ts`)

The foundation HTTP client built on Axios with advanced features:

```typescript
const apiClient = new ApiClient(config);

// Make requests with automatic retry, caching, and error handling
const data = await apiClient.get<StockSummaryDto[]>('/api/stocks');
```

**Features:**
- Automatic retry logic with exponential backoff
- Intelligent caching with TTL and tag-based invalidation
- Request deduplication to prevent race conditions
- Performance monitoring and metrics collection
- Rate limiting compliance
- Authentication token management
- Offline support and request queuing

### 2. FinancialDataService (`src/services/api/FinancialDataService.ts`)

Typed service layer for all financial data operations:

```typescript
const service = new FinancialDataService(apiClient);

// Get stocks with pagination and filtering
const stocks = await service.getStocks({
  page: 1,
  pageSize: 20,
  sector: 'Technology'
});

// Get real-time stock price
const price = await service.getLatestStockPrice('AAPL');

// Get historical OHLC data for charting
const ohlcData = await service.getOHLCData('AAPL', {
  period: 'daily',
  from: '2024-01-01',
  to: '2024-12-31'
});
```

**Available Methods:**
- `getStocks()` - Paginated stock listings with filtering
- `getStockDetails()` - Detailed stock information
- `searchStocks()` - Stock symbol/name search
- `getStockPrices()` - Historical price data
- `getLatestStockPrice()` - Current/latest price
- `getOHLCData()` - OHLC data for charting
- `getSectors()` - Market sectors
- `getExchanges()` - Stock exchanges
- Batch operations for multiple stocks
- Cache management utilities

### 3. Request/Response Transformers (`src/services/api/transformers.ts`)

Data transformation and normalization utilities:

```typescript
// Transform and validate incoming API data
const stockData = transformStockSummary(rawApiData);

// Transform request parameters
const params = transformStockQueryParams(userInput);

// Validate and sanitize data
const symbol = validateSymbol('AAPL'); // Ensures valid format
const date = validateDate('2024-01-01'); // Validates date format
```

**Features:**
- Consistent data transformation between API and frontend formats
- Input validation and sanitization
- Null/undefined value handling
- Type safety enforcement
- Backward compatibility for API changes

### 4. SignalR Real-time Client (`src/services/realtime/SignalRClient.ts`)

Real-time data updates via SignalR WebSocket connection:

```typescript
const signalRClient = new SignalRClient(config);

// Subscribe to real-time stock price updates
const subscriptionId = signalRClient.subscribeToStock('AAPL', (update) => {
  console.log('New price:', update.price);
});

// Subscribe to market status changes
signalRClient.subscribeToEvent('market:status', (status) => {
  console.log('Market is now:', status.status);
});
```

**Event Types:**
- `stock:price-update` - Real-time price changes
- `stock:trade` - Individual trade executions
- `market:status` - Market open/close status
- `watchlist:update` - User watchlist changes
- `alert:triggered` - Price alert notifications

### 5. Real-time Service (`src/services/realtime/RealTimeService.ts`)

High-level service for managing real-time connections:

```typescript
const realTimeService = getRealTimeService();

// Initialize connection
await realTimeService.initialize();

// Subscribe to multiple stocks
const subscriptionId = realTimeService.subscribeToStocks(
  ['AAPL', 'GOOGL', 'MSFT'],
  (update) => {
    console.log(`${update.symbol}: $${update.price}`);
  }
);

// Clean up
realTimeService.unsubscribe(subscriptionId);
```

## React Query Integration

### Basic Usage

```typescript
import { useStocks, useStockDetails, useRealtimeStockPrice } from '../hooks/useFinancialQuery';

function StockList() {
  // Fetch stocks with caching
  const { data: stocks, isLoading, error } = useStocks({
    page: 1,
    pageSize: 20
  });

  // Get specific stock details
  const { data: stockDetails } = useStockDetails('AAPL');

  // Enable real-time price updates
  const { connected } = useRealtimeStockPrice('AAPL');

  return (
    <div>
      {stocks?.items.map(stock => (
        <div key={stock.symbol}>
          {stock.companyName}: ${stock.price}
          {connected && <span>🔴 Live</span>}
        </div>
      ))}
    </div>
  );
}
```

### Available Hooks

**Data Fetching Hooks:**
- `useStocks(params)` - Paginated stock listings
- `useStockDetails(symbol)` - Individual stock details
- `useStockSearch(query)` - Search stocks
- `useStockPrices(symbol, params)` - Historical prices
- `useLatestStockPrice(symbol)` - Current price
- `useOHLCData(symbol, params)` - Chart data
- `useSectors()` - Market sectors
- `useExchanges()` - Stock exchanges

**Real-time Hooks:**
- `useRealtimeStockPrice(symbol)` - Real-time price updates
- `useRealtimeStockPrices(symbols)` - Multiple stock updates
- `useRealtimeMarketStatus()` - Market status changes
- `useStockWithRealtimePrice(symbol)` - Combined data + real-time
- `useRealtimeConnection()` - Connection management

## Configuration

### API Client Configuration

```typescript
// src/services/api/config.ts
export const DEFAULT_API_CONFIG: ApiClientConfig = {
  baseURL: 'http://localhost:5042',
  timeout: 30000,
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => error.response?.status >= 500
  },
  cache: {
    enabled: true,
    defaultTTL: 300000, // 5 minutes
    maxSize: 100
  },
  auth: {
    tokenType: 'Bearer',
    tokenKey: 'access_token',
    refreshThreshold: 300
  }
};
```

### Cache TTL Settings

```typescript
export const CACHE_TTL = {
  stockList: 5 * 60 * 1000,      // 5 minutes
  stockDetails: 10 * 60 * 1000,   // 10 minutes
  stockPrices: 1 * 60 * 1000,     // 1 minute
  realtimePrices: 10 * 1000,      // 10 seconds
  sectors: 60 * 60 * 1000,        // 1 hour
  exchanges: 60 * 60 * 1000       // 1 hour
};
```

### Real-time Configuration

```typescript
const SIGNALR_CONFIG: ConnectionConfig = {
  url: 'http://localhost:5042/hubs/market',
  options: {
    skipNegotiation: true,
    transport: 1, // WebSockets only
    logging: import.meta.env.DEV ? 2 : 0
  },
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    delay: 1000
  }
};
```

## Error Handling

### Error Types

The system defines several error types for consistent handling:

```typescript
export const ApiErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;
```

### Error Recovery

```typescript
// Automatic retry for transient errors
const data = await apiClient.get('/api/stocks', {
  retries: 3,
  retryCondition: (error) => {
    return error.type === 'NETWORK_ERROR' || 
           error.type === 'TIMEOUT_ERROR' ||
           error.response?.status >= 500;
  }
});

// Manual error handling
try {
  const stocks = await financialDataService.getStocks();
} catch (error) {
  if (error.type === 'AUTHENTICATION_ERROR') {
    // Redirect to login
  } else if (error.type === 'RATE_LIMIT_ERROR') {
    // Show rate limit message
  } else {
    // Show generic error
  }
}
```

## Performance Features

### Caching Strategy

1. **TTL-based caching** - Different cache durations for different data types
2. **Tag-based invalidation** - Selective cache clearing
3. **ETag support** - Server-side validation
4. **Memory management** - LRU eviction when cache is full

### Request Optimization

1. **Request deduplication** - Prevents duplicate simultaneous requests
2. **Batch operations** - Multiple stocks in single request
3. **Intelligent prefetching** - Preload related data
4. **Connection pooling** - Efficient HTTP connection reuse

### Performance Monitoring

```typescript
// Get performance statistics
const stats = apiClient.getPerformanceStats();
console.log('Average response time:', stats.averageResponseTime);
console.log('Cache hit rate:', stats.cacheHitRate);
console.log('Total requests:', stats.totalRequests);
```

## Testing

### Unit Testing

```typescript
// Mock API client for testing
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  // ... other methods
};

const service = new FinancialDataService(mockApiClient);

// Test service methods
mockApiClient.get.mockResolvedValue(mockStockData);
const result = await service.getStocks();
expect(result).toEqual(expectedStocks);
```

### Integration Testing

```typescript
// Test real API endpoints
describe('FinancialDataService Integration', () => {
  it('should fetch stocks from real API', async () => {
    const service = createFinancialDataService();
    const stocks = await service.getStocks({ page: 1, pageSize: 10 });
    
    expect(stocks.items).toHaveLength(10);
    expect(stocks.pagination.page).toBe(1);
  });
});
```

## Deployment Considerations

### Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=https://api.financescreener.com
VITE_SIGNALR_URL=wss://api.financescreener.com/hubs/market

# Feature Flags
VITE_ENABLE_REALTIME=true
VITE_ENABLE_CACHING=true
VITE_ENABLE_DEVTOOLS=false

# Performance
VITE_API_TIMEOUT=30000
VITE_CACHE_SIZE=100
VITE_RETRY_ATTEMPTS=3
```

### Production Optimizations

1. **Bundle splitting** - Separate chunks for API services
2. **Tree shaking** - Remove unused exports
3. **Service worker** - Background request processing
4. **CDN caching** - Static asset optimization

## Security

### Authentication

```typescript
// JWT token management
const authService = new AuthService();
await authService.login(credentials);

// Automatic token refresh
apiClient.interceptors.request.use(async (config) => {
  const token = await authService.getValidToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Data Validation

All API responses are validated and transformed:

```typescript
// Input validation
const symbol = validateSymbol(userInput); // Prevents injection
const date = validateDate(dateInput);     // Ensures valid dates
const amount = validateNumber(numInput, 0, 1000000); // Range validation
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check network connectivity
   - Verify API server status
   - Increase timeout configuration

2. **Cache Issues**
   - Clear browser cache
   - Reset query client cache
   - Check cache TTL settings

3. **Real-time Connection Failures**
   - Verify SignalR hub URL
   - Check WebSocket support
   - Review firewall settings

### Debug Tools

```typescript
// Enable debug logging
localStorage.setItem('debug', 'financescreener:*');

// Performance monitoring
const stats = apiClient.getPerformanceStats();
console.table(stats);

// Connection diagnostics
const status = realTimeService.getConnectionStats();
console.log('Connection status:', status);
```

## Future Enhancements

1. **GraphQL Integration** - More efficient data fetching
2. **Service Worker Caching** - Offline-first approach
3. **Request Batching** - Combine multiple requests
4. **Streaming APIs** - Server-sent events for live data
5. **Edge Caching** - CDN-based response caching
6. **Request Analytics** - Detailed usage metrics

## Related Documentation

- [Story 2.1.1: Context API Data Management](./story-2.1.1-context-api-data-management.md)
- [Story 2.1.3: D3.js Candlestick Chart Component](./story-2.1.3-d3js-candlestick-chart.md)
- [API Documentation](../backend-api-documentation.md)
- [Project Status](../PROJECT_STATUS.md)
