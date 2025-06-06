# Story 2.1.2: Backend Request Infrastructure Setup

## 📋 Story Overview
- **Epic**: Frontend Chart Components & Visualization
- **Story ID**: 2.1.2
- **Priority**: High
- **Story Points**: 8
- **Sprint**: 3

## 🎯 User Story
**As a** frontend developer  
**I want** a robust, industry-standard backend request infrastructure  
**So that** I can efficiently fetch and manage financial data from the API with proper error handling, caching, and real-time capabilities

## 📝 Acceptance Criteria

### API Client Architecture
- [ ] Implement Axios-based HTTP client with interceptors
- [ ] Create typed API service classes for different endpoints
- [ ] Set up request/response transformers for data normalization
- [ ] Implement automatic retry logic with exponential backoff
- [ ] Add request deduplication to prevent duplicate calls

### Authentication & Security
- [ ] Implement JWT token management with automatic refresh
- [ ] Add API key rotation and management
- [ ] Set up CORS handling and preflight requests
- [ ] Implement request signing for sensitive operations
- [ ] Add rate limiting and throttling mechanisms

### Caching Strategy
- [ ] Implement HTTP cache with ETags and Last-Modified headers
- [ ] Create memory cache for frequently accessed data
- [ ] Add cache invalidation strategies (TTL, manual, event-based)
- [ ] Set up cache warming for critical data
- [ ] Implement offline cache with IndexedDB fallback

### Real-time Updates
- [ ] Set up WebSocket connection with automatic reconnection
- [ ] Implement event-driven data updates
- [ ] Create subscription management for real-time feeds
- [ ] Add connection status monitoring and indicators
- [ ] Handle offline/online state transitions gracefully

### Error Handling & Monitoring
- [ ] Comprehensive error typing and classification
- [ ] Automatic error recovery strategies
- [ ] Request timeout handling with customizable timeouts
- [ ] Network failure detection and retry logic
- [ ] Performance monitoring and analytics integration

## 🛠️ Technical Implementation

### 1. API Client Foundation

```typescript
// services/api/ApiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  apiKey?: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId?: string;
  retryable: boolean;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private requestCache = new Map<string, Promise<any>>();

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication and logging
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID for request tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId();
        
        // Add timestamp for performance monitoring
        config.metadata = { startTime: Date.now() };
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.transformError(error));
      }
    );

    // Response interceptor for error handling and logging
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata?.startTime;
        console.log(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);
        
        // Transform response data if needed
        return this.transformResponse(response);
      },
      async (error: AxiosError) => {
        const duration = error.config?.metadata?.startTime 
          ? Date.now() - error.config.metadata.startTime 
          : 0;
        
        console.error(`API Error: ${error.response?.status} ${error.config?.url} (${duration}ms)`, error);
        
        // Handle retries for specific error conditions
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }
        
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformResponse(response: AxiosResponse): AxiosResponse {
    // Add response metadata
    response.metadata = {
      cached: false,
      timestamp: new Date(),
      requestId: response.headers['x-request-id'],
    };
    
    return response;
  }

  private transformError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      retryable: this.isRetryableError(error),
    };

    if (error.response) {
      // Server responded with error status
      apiError.code = `HTTP_${error.response.status}`;
      apiError.message = error.response.data?.message || error.message;
      apiError.details = error.response.data;
      apiError.requestId = error.response.headers['x-request-id'];
    } else if (error.request) {
      // Request was made but no response received
      apiError.code = 'NETWORK_ERROR';
      apiError.message = 'Network error - no response received';
      apiError.retryable = true;
    }

    return apiError;
  }

  private shouldRetry(error: AxiosError): boolean {
    if (!error.config || error.config.__retryCount >= this.config.retryAttempts) {
      return false;
    }

    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config!;
    config.__retryCount = (config.__retryCount || 0) + 1;

    const delay = this.config.retryDelay * Math.pow(2, config.__retryCount - 1);
    console.log(`Retrying request ${config.__retryCount}/${this.config.retryAttempts} after ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));
    return this.client.request(config);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isRetryableError(error: any): boolean {
    // Define which errors are retryable
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'ECONNRESET'];
    
    return retryableStatusCodes.includes(error.response?.status) || 
           retryableCodes.includes(error.code);
  }

  // Request deduplication
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.generateCacheKey(config);
    
    if (this.requestCache.has(cacheKey)) {
      console.log(`Using cached request: ${cacheKey}`);
      return this.requestCache.get(cacheKey)!;
    }

    const requestPromise = this.client.request<T>(config).then(response => response.data);
    this.requestCache.set(cacheKey, requestPromise);

    // Clean up cache entry after request completes
    requestPromise.finally(() => {
      setTimeout(() => this.requestCache.delete(cacheKey), 1000);
    });

    return requestPromise;
  }

  private generateCacheKey(config: AxiosRequestConfig): string {
    return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params)}`;
  }
}
```

### 2. Financial Data Service Layer

```typescript
// services/api/FinancialDataService.ts
import { ApiClient } from './ApiClient';
import type { 
  StockData, 
  OHLCV, 
  TechnicalIndicators, 
  Timeframe,
  MarketData 
} from '../../types/FinancialTypes';

export interface StockDataRequest {
  symbol: string;
  timeframe: Timeframe;
  indicators?: string[];
  includeVolume?: boolean;
  limit?: number;
}

export interface StockDataResponse {
  symbol: string;
  data: OHLCV[];
  indicators: TechnicalIndicators;
  metadata: {
    timeframe: Timeframe;
    lastUpdated: string;
    dataSource: string;
    totalRecords: number;
  };
}

export class FinancialDataService {
  constructor(private apiClient: ApiClient) {}

  async getStockData(request: StockDataRequest): Promise<StockDataResponse> {
    const { symbol, timeframe, indicators, includeVolume = true, limit } = request;
    
    try {
      const response = await this.apiClient.request<StockDataResponse>({
        method: 'GET',
        url: `/api/stocks/${symbol}/data`,
        params: {
          timeframe,
          indicators: indicators?.join(','),
          includeVolume,
          limit,
        },
        // Cache for 5 minutes for historical data
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });

      return this.transformStockDataResponse(response);
    } catch (error) {
      console.error(`Failed to fetch stock data for ${symbol}:`, error);
      throw error;
    }
  }

  async getCurrentPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number }> {
    try {
      return await this.apiClient.request({
        method: 'GET',
        url: `/api/stocks/${symbol}/price`,
        // Very short cache for current prices
        headers: {
          'Cache-Control': 'max-age=30',
        },
      });
    } catch (error) {
      console.error(`Failed to fetch current price for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultipleStocks(symbols: string[], timeframe: Timeframe): Promise<Record<string, StockDataResponse>> {
    try {
      const response = await this.apiClient.request<Record<string, StockDataResponse>>({
        method: 'POST',
        url: '/api/stocks/batch',
        data: {
          symbols,
          timeframe,
        },
      });

      // Transform each stock data response
      const result: Record<string, StockDataResponse> = {};
      for (const [symbol, data] of Object.entries(response)) {
        result[symbol] = this.transformStockDataResponse(data);
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch multiple stocks:', error);
      throw error;
    }
  }

  async searchStocks(query: string, limit: number = 10): Promise<Array<{
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }>> {
    try {
      return await this.apiClient.request({
        method: 'GET',
        url: '/api/stocks/search',
        params: { q: query, limit },
      });
    } catch (error) {
      console.error(`Failed to search stocks with query "${query}":`, error);
      throw error;
    }
  }

  async getMarketData(): Promise<MarketData> {
    try {
      return await this.apiClient.request({
        method: 'GET',
        url: '/api/market/summary',
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      throw error;
    }
  }

  private transformStockDataResponse(response: StockDataResponse): StockDataResponse {
    // Transform dates and ensure proper data types
    return {
      ...response,
      data: response.data.map(ohlcv => ({
        ...ohlcv,
        time: new Date(ohlcv.time).getTime() / 1000, // Convert to timestamp
      })),
      metadata: {
        ...response.metadata,
        lastUpdated: new Date(response.metadata.lastUpdated).toISOString(),
      },
    };
  }
}
```

### 3. WebSocket Real-time Service

```typescript
// services/api/WebSocketService.ts
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export type WebSocketEventHandler = (data: any) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();
  private eventHandlers = new Map<string, Set<WebSocketEventHandler>>();
  private isConnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for current connection attempt
        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;
      console.log('Connecting to WebSocket:', this.config.url);

      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribeAll();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  subscribe(symbol: string): void {
    this.subscriptions.add(symbol);
    
    if (this.isConnected()) {
      this.sendMessage({
        type: 'subscribe',
        symbol,
      });
    }
  }

  unsubscribe(symbol: string): void {
    this.subscriptions.delete(symbol);
    
    if (this.isConnected()) {
      this.sendMessage({
        type: 'unsubscribe',
        symbol,
      });
    }
  }

  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Emit to specific event handlers
      const handlers = this.eventHandlers.get(data.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Error in WebSocket event handler:', error);
          }
        });
      }

      // Emit to general message handlers
      const generalHandlers = this.eventHandlers.get('message');
      if (generalHandlers) {
        generalHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Error in WebSocket message handler:', error);
          }
        });
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private sendMessage(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach(symbol => {
      this.sendMessage({
        type: 'subscribe',
        symbol,
      });
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
```

### 4. Cache Management Service

```typescript
// services/api/CacheService.ts
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  storageType: 'memory' | 'indexeddb' | 'hybrid';
}

export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL,
    };

    this.memoryCache.set(key, entry);
    this.enforceMaxSize();
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const entryTime = entry.timestamp.getTime();
    return (now - entryTime) > entry.ttl;
  }

  private enforceMaxSize(): void {
    if (this.memoryCache.size <= this.config.maxSize) {
      return;
    }

    // Remove oldest entries first
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

    const toRemove = entries.slice(0, this.memoryCache.size - this.config.maxSize);
    toRemove.forEach(([key]) => this.memoryCache.delete(key));
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.memoryCache.delete(key));
    }, 60000); // Clean up every minute
  }
}
```

## 📋 Implementation Report & Decision Logic

### API Client Architecture Decisions

#### 1. **Axios vs Fetch API**
**Decision**: Use Axios as the primary HTTP client.

**Logic**:
- Built-in request/response interceptors for cross-cutting concerns
- Automatic JSON parsing and error handling
- Better TypeScript support with typed configurations
- Request/response transformation capabilities
- Built-in timeout and cancellation support
- Larger ecosystem and community support
- Easier mocking and testing

#### 2. **Error Handling Strategy**
**Decision**: Implement comprehensive error classification with retry logic.

**Logic**:
- Different error types require different handling strategies
- Retryable vs non-retryable errors improve user experience
- Exponential backoff prevents server overload during issues
- Error correlation IDs help with debugging and monitoring
- Typed error interfaces provide better development experience

#### 3. **Request Deduplication**
**Decision**: Implement automatic deduplication for identical requests.

**Logic**:
- Prevents unnecessary duplicate API calls
- Improves performance and reduces server load
- Especially important for rapidly changing UI components
- Cache key includes method, URL, and parameters for accuracy
- Short-lived cache prevents memory leaks

#### 4. **WebSocket vs Server-Sent Events**
**Decision**: Use WebSocket for real-time data with fallback capability.

**Logic**:
- Bidirectional communication allows subscription management
- Lower latency for high-frequency price updates
- Better connection management and error handling
- Supports custom protocols for financial data streaming
- More suitable for complex real-time interactions

#### 5. **Caching Strategy**
**Decision**: Multi-layered caching with HTTP cache + memory cache.

**Logic**:
- HTTP cache leverages browser capabilities and ETags
- Memory cache provides immediate access for frequently used data
- TTL-based expiration balances freshness with performance
- Pattern-based invalidation enables selective cache clearing
- Size limits prevent memory bloat in long-running applications

### Service Layer Design Decisions

#### 1. **Service Separation**
**Decision**: Separate services for HTTP API, WebSocket, and caching.

**Logic**:
- Single responsibility principle improves maintainability
- Easier to test individual service components
- Allows for different configuration per service type
- Better error isolation between service types
- Enables progressive enhancement (start with HTTP, add WebSocket)

#### 2. **Type Safety Strategy**
**Decision**: Full TypeScript integration with strict typing.

**Logic**:
- Compile-time error detection for API contracts
- Better IDE support with autocomplete and documentation
- Easier refactoring when API changes occur
- Self-documenting code with interface definitions
- Reduces runtime errors from data shape mismatches

#### 3. **Connection Management**
**Decision**: Automatic reconnection with exponential backoff.

**Logic**:
- Handles network interruptions gracefully
- Exponential backoff prevents overwhelming server during issues
- Maximum attempt limits prevent infinite loops
- Connection state monitoring enables UI feedback
- Heartbeat mechanism detects silent connection failures

### Performance and Monitoring Decisions

#### 1. **Request Monitoring**
**Decision**: Comprehensive logging and performance tracking.

**Logic**:
- Request correlation IDs enable end-to-end tracing
- Performance metrics help identify bottlenecks
- Error tracking helps with debugging and monitoring
- Response time logging enables performance optimization
- Request counting helps with rate limiting and capacity planning

#### 2. **Memory Management**
**Decision**: Automatic cleanup with size limits and TTL expiration.

**Logic**:
- Prevents memory leaks in long-running applications
- LRU-style eviction for cache size management
- TTL ensures data freshness without manual intervention
- Configurable limits allow tuning per environment
- Regular cleanup prevents gradual memory growth

## 🔧 Technical Tasks

### Phase 1: Core API Client (Week 1)
- [ ] Set up Axios client with TypeScript configuration
- [ ] Implement request/response interceptors
- [ ] Add error transformation and classification
- [ ] Create retry logic with exponential backoff
- [ ] Set up request correlation and logging

### Phase 2: Service Layer Implementation (Week 2)
- [ ] Build FinancialDataService with all endpoints
- [ ] Create comprehensive TypeScript interfaces
- [ ] Implement data transformation and validation
- [ ] Add service-level error handling
- [ ] Create API service factory and configuration

### Phase 3: Real-time Infrastructure (Week 3)
- [ ] Implement WebSocket service with reconnection
- [ ] Add subscription management for price feeds
- [ ] Create connection monitoring and status reporting
- [ ] Build event-driven update system
- [ ] Add offline/online state handling

### Phase 4: Caching and Optimization (Week 4)
- [ ] Implement multi-layered caching strategy
- [ ] Add HTTP cache with ETag support
- [ ] Create cache invalidation patterns
- [ ] Build performance monitoring and metrics
- [ ] Add request deduplication and optimization

## 🧪 Testing Strategy

### Unit Tests
- API client configuration and interceptor logic
- Error transformation and retry mechanisms
- WebSocket connection management and reconnection
- Cache operations and TTL expiration logic
- Service method calls with mocked responses

### Integration Tests
- End-to-end API flows with real backend
- WebSocket connection and subscription management
- Cache behavior under various load conditions
- Error scenarios and recovery mechanisms
- Performance characteristics under load

### Network Simulation Tests
- Offline/online state transitions
- Network latency and timeout scenarios
- Flaky connection handling
- Rate limiting and throttling behavior
- WebSocket reconnection during network issues

## 📈 Success Metrics
- [ ] API client handles all error scenarios gracefully
- [ ] WebSocket maintains stable connection with auto-reconnect
- [ ] Request response times average under 100ms for cached data
- [ ] Cache hit ratio exceeds 80% for repeated requests
- [ ] Zero memory leaks during 24-hour continuous operation

## 🔗 Dependencies
- **Story 1.4**: Data Calculation Service (for API endpoints structure)
- **Story 2.1.1**: Context API Data Management (for integration points)

## 🚀 Next Steps
After completion, this infrastructure will enable:
- **Story 2.1.3**: D3.js chart component data integration
- **Story 2.2**: Real-time data updates and streaming
- **Story 3.1**: Stock search and symbol management
- **Story 5.1**: Real-time price updates via WebSocket
