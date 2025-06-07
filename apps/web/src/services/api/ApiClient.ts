/**
 * API Client Implementation
 * Provides robust HTTP client with retry logic, caching, and error handling
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';
import type {
  ApiClientConfig,
  ApiError,
  ApiErrorType,
  RequestOptions,
  RequestMetrics,
  PerformanceStats,  RateLimitStatus,
  CacheEntry
} from '../../types/ApiTypes';

// Extend Axios request config to include our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    __retryCount?: number;
    __startTime?: number;
    __cacheKey?: string;
    metadata?: {
      startTime?: number;
      cacheKey?: string;
    };
  }

  export interface AxiosResponse {
    metadata?: {
      cached: boolean;
      timestamp: Date;
      requestId?: string;
      duration?: number;
    };
  }
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private requestCache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();
  private metrics: RequestMetrics[] = [];
  private rateLimitStatus: RateLimitStatus | null = null;

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
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add timing metadata
        config.__startTime = Date.now();
        config.metadata = { startTime: Date.now() };

        // Add correlation ID for request tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId();

        // Add performance monitoring
        this.logRequest(config);

        return config;
      },
      (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.transformError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        const duration = response.config.__startTime 
          ? Date.now() - response.config.__startTime 
          : 0;

        // Add response metadata
        response.metadata = {
          cached: false,
          timestamp: new Date(),
          requestId: response.headers['x-request-id'],
          duration
        };

        // Update rate limit status
        this.updateRateLimitStatus(response.headers);

        // Log successful response
        this.logResponse(response, duration);

        return response;
      },
      async (error: AxiosError) => {
        const duration = error.config?.__startTime 
          ? Date.now() - error.config.__startTime 
          : 0;

        // Log error response
        this.logError(error, duration);

        // Update rate limit status from error response
        if (error.response?.headers) {
          this.updateRateLimitStatus(error.response.headers);
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          console.warn(`Rate limited. Retrying after ${retryAfter} seconds`);
          await this.delay(retryAfter * 1000);
          return this.retryRequest(error);
        }

        // Handle retries for retryable errors
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private logRequest(config: InternalAxiosRequestConfig): void {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  }

  private logResponse(response: AxiosResponse, duration: number): void {
    const size = JSON.stringify(response.data).length;
    console.log(
      `✅ API Response: ${response.status} ${response.config.url} (${duration}ms, ${size} bytes)`
    );
  }

  private logError(error: AxiosError, duration: number): void {
    console.error(
      `❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`,
      error.message
    );
  }

  private updateRateLimitStatus(headers: any): void {
    if (headers['x-ratelimit-limit']) {
      this.rateLimitStatus = {
        limit: parseInt(headers['x-ratelimit-limit']),
        remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
        reset: parseInt(headers['x-ratelimit-reset'] || '0'),
        retryAfter: headers['retry-after'] ? parseInt(headers['retry-after']) : undefined
      };
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    if (!error.config || (error.config as any).__retryCount >= this.config.retryConfig.retries) {
      return false;
    }

    // Don't retry if we have a custom retry condition that returns false
    if (this.config.retryConfig.retryCondition && !this.config.retryConfig.retryCondition(error)) {
      return false;
    }

    // Retry on network errors or 5xx server errors (but not 429 which is handled separately)
    return (
      !error.response || 
      (error.response.status >= 500 && error.response.status < 600 && error.response.status !== 429)
    );
  }

  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config!;
    (config as any).__retryCount = ((config as any).__retryCount || 0) + 1;

    const delay = this.config.retryConfig.retryDelay * Math.pow(2, (config as any).__retryCount - 1);
    console.log(`🔄 Retrying request ${(config as any).__retryCount}/${this.config.retryConfig.retries} after ${delay}ms`);

    await this.delay(delay);
    return this.client.request(config);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private transformError(error: any): ApiError {
    const apiError: ApiError = {
      name: 'ApiError',
      message: error.message || 'An unknown error occurred',
      type: this.getErrorType(error),
      retryable: this.isRetryableError(error),
      originalError: error
    };

    if (error.response) {
      // Server responded with error status
      apiError.statusCode = error.response.status;
      apiError.response = error.response.data;
      apiError.message = error.response.data?.message || error.message;
    } else if (error.request) {
      // Request was made but no response received
      apiError.type = 'NETWORK_ERROR';
      apiError.message = 'Network error - no response received';
      apiError.retryable = true;
    }

    return apiError;
  }

  private getErrorType(error: any): ApiErrorType {
    if (!error.response) return 'NETWORK_ERROR';

    const status = error.response.status;
    if (status === 401) return 'AUTHENTICATION_ERROR';
    if (status === 403) return 'AUTHORIZATION_ERROR';
    if (status === 408) return 'TIMEOUT_ERROR';
    if (status === 429) return 'RATE_LIMIT_ERROR';
    if (status >= 400 && status < 500) return 'CLIENT_ERROR';
    if (status >= 500) return 'SERVER_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  private isRetryableError(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'ECONNRESET'];
    
    return (
      retryableStatusCodes.includes(error.response?.status) || 
      retryableCodes.includes(error.code)
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(config: AxiosRequestConfig): string {
    return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params)}`;
  }

  private getCachedResponse<T>(cacheKey: string): T | null {
    if (!this.config.cache.enabled) return null;

    const cached = this.requestCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const age = (now - cached.timestamp) / 1000;

    if (age > cached.ttl) {
      this.requestCache.delete(cacheKey);
      return null;
    }

    console.log(`📋 Cache hit: ${cacheKey}`);
    return cached.data;
  }

  private setCachedResponse<T>(cacheKey: string, data: T, ttl?: number): void {
    if (!this.config.cache.enabled) return;

    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cache.defaultTTL
    };

    this.requestCache.set(cacheKey, cacheEntry);    // Enforce cache size limit
    if (this.requestCache.size > this.config.cache.maxSize) {
      const firstKey = this.requestCache.keys().next().value;
      if (firstKey) {
        this.requestCache.delete(firstKey);
      }
    }
  }

  // Public API methods
  async request<T>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    const cacheKey = this.generateCacheKey(config);

    // Check cache first
    if (!options?.cache?.tags?.includes('no-cache')) {
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) return cached;
    }

    // Check if same request is already in flight (request deduplication)
    if (this.requestQueue.has(cacheKey)) {
      console.log(`🔗 Deduplicating request: ${cacheKey}`);
      return this.requestQueue.get(cacheKey)!;
    }

    // Apply options to config
    const finalConfig = {
      ...config,
      timeout: options?.timeout || config.timeout,
      signal: options?.signal,
      headers: {
        ...config.headers,
        ...options?.headers
      },
      params: {
        ...config.params,
        ...options?.params
      }
    };

    // Execute request
    const requestPromise = this.client.request<T>(finalConfig)
      .then(response => {
        // Cache successful response
        if (response.status >= 200 && response.status < 300) {
          this.setCachedResponse(cacheKey, response.data, options?.cache?.ttl);
        }
        return response.data;
      })
      .finally(() => {
        // Clean up request queue
        this.requestQueue.delete(cacheKey);
      });

    this.requestQueue.set(cacheKey, requestPromise);
    return requestPromise;
  }

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'GET', url }, options);
  }

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'POST', url, data }, options);
  }

  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data }, options);
  }

  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data }, options);
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'DELETE', url }, options);
  }

  // Cache management
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.requestCache.clear();
      console.log('🗑️ Cache cleared');
      return;
    }

    const keysToDelete = Array.from(this.requestCache.keys())
      .filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => this.requestCache.delete(key));
    console.log(`🗑️ Cache cleared for pattern: ${pattern} (${keysToDelete.length} entries)`);
  }

  // Performance metrics
  getPerformanceStats(): PerformanceStats {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => !m.error).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = totalRequests > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;
    const cacheHitRate = totalRequests > 0
      ? this.metrics.filter(m => m.cached).length / totalRequests
      : 0;
    
    const errors: Record<string, number> = {};
    this.metrics.forEach(m => {
      if (m.error) {
        errors[m.error] = (errors[m.error] || 0) + 1;
      }
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      cacheHitRate,
      errors
    };
  }

  getRateLimitStatus(): RateLimitStatus | null {
    return this.rateLimitStatus;
  }

  // Configuration updates
  updateConfig(updates: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update axios instance if base config changed
    if (updates.baseURL || updates.timeout) {
      this.client.defaults.baseURL = this.config.baseURL;
      this.client.defaults.timeout = this.config.timeout;
    }
  }
}
