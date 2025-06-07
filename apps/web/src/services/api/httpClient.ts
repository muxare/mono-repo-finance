/**
 * HTTP Client - Axios-based HTTP client with interceptors, retry logic, and error handling
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { 
  ApiClientConfig, 
  RequestOptions, 
  ApiError, 
  ApiErrorType, 
  RequestMetrics,
  AuthToken 
} from '../../types/ApiTypes';
import { DEFAULT_API_CONFIG, ERROR_MESSAGES } from './config';

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private config: ApiClientConfig;
  private requestMetrics: RequestMetrics[] = [];
  private authToken: AuthToken | null = null;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_API_CONFIG, ...config };
    this.axiosInstance = this.createAxiosInstance();
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
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        if (this.authToken?.accessToken) {
          config.headers.Authorization = `${this.config.auth.tokenType} ${this.authToken.accessToken}`;
        }        // Add request timestamp for metrics
        (config as any).metadata = { startTime: Date.now() };

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.recordMetrics(response);
        return response;
      },
      async (error) => {
        this.recordMetrics(null, error);
        
        // Handle token refresh
        if (error.response?.status === 401 && this.authToken?.refreshToken) {
          try {
            await this.refreshToken();
            // Retry the original request
            return this.axiosInstance.request(error.config);
          } catch (refreshError) {
            this.clearAuthToken();
            return Promise.reject(this.handleError(refreshError));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }  private recordMetrics(response: AxiosResponse | null, error?: AxiosError): void {
    const config = response?.config || error?.config;
    if (!config || !(config as any)?.metadata?.startTime) return;

    const endTime = Date.now();
    const metadata = (config as any).metadata;
    const metrics: RequestMetrics = {
      url: config.url || '',
      method: config.method?.toUpperCase() || 'GET',
      startTime: metadata.startTime,
      endTime,
      duration: endTime - metadata.startTime,
      statusCode: response?.status || error?.response?.status,
      cached: false, // Will be set by cache layer
      retryCount: metadata?.retryCount || 0,
      error: error ? this.getErrorType(error) : undefined
    };

    this.requestMetrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.requestMetrics.length > 1000) {
      this.requestMetrics = this.requestMetrics.slice(-1000);
    }
  }

  private handleError(error: any): ApiError {
    let errorType: ApiErrorType;
    let message: string;
    let retryable = false;

    if (!error.response) {
      // Network error
      errorType = 'NETWORK_ERROR';
      message = ERROR_MESSAGES.NETWORK_ERROR;
      retryable = true;
    } else {
      const status = error.response.status;
      switch (true) {
        case status === 401:
          errorType = 'AUTHENTICATION_ERROR';
          message = ERROR_MESSAGES.AUTHENTICATION_ERROR;
          break;
        case status === 403:
          errorType = 'AUTHORIZATION_ERROR';
          message = ERROR_MESSAGES.AUTHORIZATION_ERROR;
          break;
        case status === 408:
          errorType = 'TIMEOUT_ERROR';
          message = ERROR_MESSAGES.TIMEOUT_ERROR;
          retryable = true;
          break;
        case status === 429:
          errorType = 'RATE_LIMIT_ERROR';
          message = ERROR_MESSAGES.RATE_LIMIT_ERROR;
          retryable = true;
          break;
        case status >= 400 && status < 500:
          errorType = status === 422 ? 'VALIDATION_ERROR' : 'CLIENT_ERROR';
          message = status === 422 ? ERROR_MESSAGES.VALIDATION_ERROR : ERROR_MESSAGES.CLIENT_ERROR;
          break;
        case status >= 500:
          errorType = 'SERVER_ERROR';
          message = ERROR_MESSAGES.SERVER_ERROR;
          retryable = true;
          break;
        default:
          errorType = 'UNKNOWN_ERROR';
          message = ERROR_MESSAGES.UNKNOWN_ERROR;
      }
    }

    const apiError = new Error(message) as ApiError;
    apiError.type = errorType;
    apiError.statusCode = error.response?.status;
    apiError.response = error.response?.data;
    apiError.originalError = error;
    apiError.retryable = retryable;

    return apiError;
  }

  private getErrorType(error: AxiosError): string {
    if (!error.response) return 'NETWORK_ERROR';
    const status = error.response.status;
    if (status >= 500) return 'SERVER_ERROR';
    if (status >= 400) return 'CLIENT_ERROR';
    return 'UNKNOWN_ERROR';
  }

  private async refreshToken(): Promise<void> {
    if (!this.authToken?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.axiosInstance.post('/auth/refresh', {
      refreshToken: this.authToken.refreshToken
    });

    this.setAuthToken(response.data);
  }

  // Public methods
  public setAuthToken(token: AuthToken): void {
    this.authToken = token;
    
    // Store token based on configuration
    if (this.config.auth.tokenKey) {
      const storage = localStorage; // Could be configurable
      storage.setItem(this.config.auth.tokenKey, JSON.stringify(token));
    }
  }

  public clearAuthToken(): void {
    this.authToken = null;
    
    if (this.config.auth.tokenKey) {
      const storage = localStorage;
      storage.removeItem(this.config.auth.tokenKey);
    }
  }

  public getAuthToken(): AuthToken | null {
    if (!this.authToken && this.config.auth.tokenKey) {
      const storage = localStorage;
      const tokenData = storage.getItem(this.config.auth.tokenKey);
      if (tokenData) {
        try {
          this.authToken = JSON.parse(tokenData);
        } catch {
          // Invalid token data, remove it
          storage.removeItem(this.config.auth.tokenKey);
        }
      }
    }
    
    return this.authToken;
  }

  public async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const config = this.buildRequestConfig('GET', url, options);
    const response = await this.executeWithRetry<T>(config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const config = this.buildRequestConfig('POST', url, options, data);
    const response = await this.executeWithRetry<T>(config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const config = this.buildRequestConfig('PUT', url, options, data);
    const response = await this.executeWithRetry<T>(config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const config = this.buildRequestConfig('PATCH', url, options, data);
    const response = await this.executeWithRetry<T>(config);
    return response.data;
  }

  public async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const config = this.buildRequestConfig('DELETE', url, options);
    const response = await this.executeWithRetry<T>(config);
    return response.data;
  }
  private buildRequestConfig(
    method: string,
    url: string,
    options: RequestOptions,
    data?: any
  ): AxiosRequestConfig {
    const config: any = {
      method: method.toLowerCase() as any,
      url,
      data,
      timeout: options.timeout || this.config.timeout,
      headers: { ...options.headers },
      params: options.params,
      signal: options.signal,
      metadata: {
        cacheConfig: options.cache,
        retryCount: 0,
        maxRetries: options.retries || this.config.retryConfig.retries
      }
    };
    return config;
  }
  private async executeWithRetry<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    let lastError: any;
    const maxRetries = (config as any).metadata?.maxRetries || this.config.retryConfig.retries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        (config as any).metadata.retryCount = attempt;
        return await this.axiosInstance.request<T>(config);
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's not a retryable error or we've reached max retries
        const apiError = this.handleError(error);
        if (!apiError.retryable || attempt >= maxRetries) {
          throw apiError;
        }

        // Wait before retrying with exponential backoff
        const delay = this.config.retryConfig.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw this.handleError(lastError);
  }

  public getMetrics(): RequestMetrics[] {
    return [...this.requestMetrics];
  }

  public clearMetrics(): void {
    this.requestMetrics = [];
  }

  public getPerformanceStats() {
    const metrics = this.requestMetrics;
    const total = metrics.length;
    const successful = metrics.filter(m => !m.error).length;
    const failed = total - successful;
    const avgResponseTime = total > 0 
      ? metrics.reduce((sum, m) => sum + m.duration, 0) / total 
      : 0;
    
    const errors: Record<string, number> = {};
    metrics.forEach(m => {
      if (m.error) {
        errors[m.error] = (errors[m.error] || 0) + 1;
      }
    });

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: Math.round(avgResponseTime),
      cacheHitRate: 0, // Will be calculated by cache layer
      errors
    };
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
