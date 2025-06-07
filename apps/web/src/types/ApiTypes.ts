/**
 * API Types and Interfaces for Backend Request Infrastructure
 * Defines types for API requests, responses, and error handling
 */

// Base API Response Types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PagedResult<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
}

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryConfig: {
    retries: number;
    retryDelay: number;
    retryCondition?: (error: any) => boolean;
  };
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  auth: {
    tokenType: string;
    tokenKey: string;
    refreshThreshold: number; // seconds before expiry to refresh token
  };
}

// Request/Response Interceptor Types
export interface RequestInterceptor {
  onFulfilled?: (config: any) => any;
  onRejected?: (error: any) => any;
}

export interface ResponseInterceptor {
  onFulfilled?: (response: any) => any;
  onRejected?: (error: any) => any;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

export interface CacheConfig {
  key: string;
  ttl?: number;
  tags?: string[];
  dependency?: string[];
}

// Real-time Connection Types
export interface ConnectionConfig {
  url: string;
  options: {
    skipNegotiation?: boolean;
    transport?: number;
    logging?: any;
  };
  reconnect: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
  };
}

export interface ConnectionStatus {
  state: 'Disconnected' | 'Connecting' | 'Connected' | 'Disconnecting' | 'Reconnecting';
  connectionId?: string;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

// API Service Types
export interface ApiServiceOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  auth?: boolean;
}

// Query Parameter Types
export interface QueryParameters {
  [key: string]: string | number | boolean | undefined | null;
}

// Request Options
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  cache?: CacheConfig;
  auth?: boolean;
  headers?: Record<string, string>;
  params?: QueryParameters;
  signal?: AbortSignal;
}

// Error Types
export const ApiErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
} as const;

export type ApiErrorType = typeof ApiErrorType[keyof typeof ApiErrorType];

export interface ApiError extends Error {
  type: ApiErrorType;
  statusCode?: number;
  response?: ErrorResponse;
  originalError?: Error;
  retryable: boolean;
}

// Performance Monitoring Types
export interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  statusCode?: number;
  cached: boolean;
  retryCount: number;
  error?: string;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errors: Record<string, number>;
}

// Authentication Types
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
  scope?: string[];
}

export interface AuthConfig {
  loginEndpoint: string;
  refreshEndpoint: string;
  logoutEndpoint: string;
  tokenStorage: 'localStorage' | 'sessionStorage' | 'memory';
  autoRefresh: boolean;
}

// Rate Limiting Types
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Offline Support Types
export interface OfflineConfig {
  enabled: boolean;
  storageType: 'indexedDB' | 'localStorage';
  maxStorageSize: number;
  syncOnReconnect: boolean;
}

export interface OfflineRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

// Subscription Types for Real-time Updates
export interface Subscription {
  id: string;
  event: string;
  callback: (data: any) => void;
  active: boolean;
  created: Date;
}

export interface SubscriptionManager {
  subscribe: (event: string, callback: (data: any) => void) => string;
  unsubscribe: (id: string) => void;
  unsubscribeAll: () => void;
  getActiveSubscriptions: () => Subscription[];
}

// =============================================================================
// Backend API DTOs (matching C# DTOs)
// =============================================================================

export interface StockSummaryDto {
  symbol: string;
  companyName: string;
  sector: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: string;
}

export interface StockDetailDto extends StockSummaryDto {
  description: string;
  employees: number;
  founded: number;
  headquarters: string;
  website: string;
  ceo: string;
  
  // Financial metrics
  peRatio: number;
  pbRatio: number;
  eps: number;
  dividend: number;
  beta: number;
  
  // Price metrics
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: number;
  
  // Additional metrics
  bookValue: number;
  priceToBook: number;
  debtToEquity: number;
  returnOnEquity: number;
}

export interface StockPriceDto {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export interface OHLCVDto {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SectorDto {
  id: number;
  name: string;
  description: string;
  stockCount: number;
}

export interface ExchangeDto {
  id: number;
  name: string;
  code: string;
  country: string;
  timezone: string;
  stockCount: number;
}

// =============================================================================
// Request Parameter Types
// =============================================================================

export interface StockQueryParameters extends QueryParameters {
  page?: number;
  pageSize?: number;
  search?: string;
  sector?: string;
  exchange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minMarketCap?: number;
  maxMarketCap?: number;
}

export interface PriceRangeRequest extends QueryParameters {
  from?: string;
  to?: string;
  period?: string;
  limit?: number;
}

export interface OHLCRequest extends QueryParameters {
  period: 'daily' | 'weekly' | 'monthly';
  from?: string;
  to?: string;
  limit?: number;
}

// =============================================================================
// Chart and Visualization Types
// =============================================================================

export interface OHLCV {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface IndicatorData {
  time: number;
  value: number;
}

export interface IndicatorConfig {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BOLLINGER_BANDS' | 'VOLUME' | 'SUPPORT_RESISTANCE';
  visible: boolean;
  color?: string;
  data?: IndicatorData[];
  parameters?: Record<string, any>;
}

export interface ChartTheme {
  mode: 'light' | 'dark';
  colors: {
    bullish: string;
    bearish: string;
    background: string;
    text: string;
    grid: string;
    volumeBullish: string;
    volumeBearish: string;
  };
}

export interface ChartConfiguration {
  symbol: string;
  timeframe: Timeframe;
  showVolume: boolean;
  indicators: IndicatorConfig[];
  theme: ChartTheme;
  height: number;
  interactive: boolean;
}

// =============================================================================
// Service Response Types
// =============================================================================

export interface ServiceOptions {
  skipCache?: boolean;
  timeout?: number;
  signal?: AbortSignal;
}
