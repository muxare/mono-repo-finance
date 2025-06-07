/**
 * API Client Configuration
 * Central configuration for all API communication
 */

import type { ApiClientConfig, AuthConfig, RateLimitConfig, OfflineConfig } from '../../types/ApiTypes';

// Environment-based configuration
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    // Browser environment
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isDevelopment) {
      // Development: API runs on port 5042
      return 'http://localhost:5042';
    } else {
      // Production: API on same origin with /api prefix
      return window.location.origin + '/api';
    }
  }
    // Server-side rendering fallback
  return process.env.VITE_API_BASE_URL || 'http://localhost:5042';
};

export const DEFAULT_API_CONFIG: ApiClientConfig = {
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
  retryConfig: {
    retries: 3,
    retryDelay: 1000, // Start with 1 second
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, and 5xx server errors
      if (!error.response) return true; // Network error
      const status = error.response.status;
      return status >= 500 || status === 408 || status === 429;
    }
  },
  cache: {
    enabled: true,
    defaultTTL: 300000, // 5 minutes
    maxSize: 100 // Maximum number of cached entries
  },
  auth: {
    tokenType: 'Bearer',
    tokenKey: 'access_token',
    refreshThreshold: 300 // Refresh token 5 minutes before expiry
  }
};

export const AUTH_CONFIG: AuthConfig = {
  loginEndpoint: '/auth/login',
  refreshEndpoint: '/auth/refresh',
  logoutEndpoint: '/auth/logout',
  tokenStorage: 'localStorage',
  autoRefresh: true
};

export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 100, // 100 requests
  windowMs: 60000, // per minute
  skipSuccessfulRequests: false,
  skipFailedRequests: true
};

export const OFFLINE_CONFIG: OfflineConfig = {
  enabled: true,
  storageType: 'indexedDB',
  maxStorageSize: 50 * 1024 * 1024, // 50MB
  syncOnReconnect: true
};

// SignalR Configuration
export const SIGNALR_CONFIG = {
  url: getBaseURL() + '/hub/financial-data',
  options: {
    skipNegotiation: true,
    transport: 1, // WebSockets
    logging: process.env.NODE_ENV === 'development' ? console : undefined,
  },
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    delay: 5000 // 5 seconds between attempts
  }
};

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Stock endpoints
  stocks: {
    list: '/api/stocks',
    details: (symbol: string) => `/api/stocks/${symbol}`,
    search: '/api/stocks/search',
    prices: (symbol: string) => `/api/stocks/${symbol}/prices`,
    currentPrice: (symbol: string) => `/api/stocks/${symbol}/current-price`,
    historical: (symbol: string) => `/api/stocks/${symbol}/historical`,
    technicalIndicators: (symbol: string) => `/api/stocks/${symbol}/technical-indicators`
  },
  
  // Market data endpoints
  market: {
    sectors: '/api/sectors',
    exchanges: '/api/exchanges',
    indices: '/api/market/indices',
    movers: '/api/market/movers',
    summary: '/api/market/summary'
  },
  
  // Calculation endpoints
  calculations: {
    trigger: '/api/calculations/trigger',
    status: '/api/calculations/status',
    history: '/api/calculations/history'
  },
  
  // Data import endpoints
  dataImport: {
    trigger: '/api/data-import/trigger',
    status: '/api/data-import/status',
    history: '/api/data-import/history'
  },
  
  // Real-time data endpoints
  realtime: {
    subscribe: '/api/realtime/subscribe',
    unsubscribe: '/api/realtime/unsubscribe',
    status: '/api/realtime/status'
  }
} as const;

// Cache Keys Configuration
export const CACHE_KEYS = {
  stocks: {
    list: 'stocks:list',
    details: (symbol: string) => `stocks:details:${symbol}`,
    prices: (symbol: string, timeframe: string) => `stocks:prices:${symbol}:${timeframe}`,
    technicalIndicators: (symbol: string) => `stocks:technical:${symbol}`
  },
  market: {
    sectors: 'market:sectors',
    exchanges: 'market:exchanges',
    indices: 'market:indices',
    summary: 'market:summary'
  }
} as const;

// Cache TTL Configuration (in milliseconds)
export const CACHE_TTL = {
  // Stock data
  stockList: 300000, // 5 minutes
  stockDetails: 60000, // 1 minute
  stockPrices: 30000, // 30 seconds
  realtimePrices: 5000, // 5 seconds
  
  // Market data
  sectors: 3600000, // 1 hour
  exchanges: 3600000, // 1 hour
  marketSummary: 300000, // 5 minutes
  
  // Technical indicators
  technicalIndicators: 300000 // 5 minutes
} as const;

// Request timeout configuration for different endpoint types
export const REQUEST_TIMEOUTS = {
  default: 30000, // 30 seconds
  search: 10000, // 10 seconds for search requests
  realtime: 5000, // 5 seconds for real-time data
  upload: 120000, // 2 minutes for file uploads
  calculation: 180000 // 3 minutes for heavy calculations
} as const;

// Error message configuration
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  AUTHORIZATION_ERROR: 'You are not authorized to access this resource.',
  VALIDATION_ERROR: 'Invalid data provided. Please check your input.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  CLIENT_ERROR: 'Client error occurred. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OFFLINE_ERROR: 'You are currently offline. Some features may not be available.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait before trying again.'
} as const;
