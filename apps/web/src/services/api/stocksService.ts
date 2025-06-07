/**
 * Stocks API Service - Handles all stock-related API operations
 */

import type { 
  PagedResult, 
  RequestOptions,
  QueryParameters 
} from '../../types/ApiTypes';
import type { 
  StockData, 
  StockPrice, 
  TimeFrame 
} from '../../types/FinancialTypes';
import { httpClient } from './httpClient';
import { cacheManager, CacheManager } from './cacheManager';
import { API_ENDPOINTS, CACHE_KEYS, CACHE_TTL, REQUEST_TIMEOUTS } from './config';

// API DTOs (Data Transfer Objects) - matching backend response format
export interface StockSummaryDto {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  marketCap?: number;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  lastUpdated: string;
}

export interface StockDetailsDto extends StockSummaryDto {
  description?: string;
  industry?: string;
  employees?: number;
  headquarters?: string;
  website?: string;
  founded?: number;
  ceo?: string;
  dividendYield?: number;
  peRatio?: number;
  pbRatio?: number;
  epsttm?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  averageVolume?: number;
  sharesOutstanding?: number;
}

export interface StockPriceDto {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

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
  minPrice?: number;
  maxPrice?: number;
}

export interface PriceRangeRequest extends QueryParameters {
  startDate?: string;
  endDate?: string;
  timeframe?: TimeFrame;
  includeTechnicalIndicators?: boolean;
  limit?: number;
}

export class StocksApiService {
  private cache: CacheManager;

  constructor(cache: CacheManager = cacheManager) {
    this.cache = cache;
  }

  /**
   * Get paginated list of stocks with filtering and sorting
   */
  async getStocks(
    parameters: StockQueryParameters = {},
    options: RequestOptions = {}
  ): Promise<PagedResult<StockData>> {
    const cacheKey = CacheManager.generateKey(API_ENDPOINTS.stocks.list, parameters);
    
    // Check cache first
    const cached = this.cache.get<PagedResult<StockSummaryDto>>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return this.transformStocksList(cached);
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      cache: { key: cacheKey, ttl: CACHE_TTL.stockList },
      ...options,
      params: parameters
    };

    const response = await httpClient.get<PagedResult<StockSummaryDto>>(
      API_ENDPOINTS.stocks.list,
      requestOptions
    );

    // Cache the response
    this.cache.set(cacheKey, response, requestOptions.cache);

    return this.transformStocksList(response);
  }

  /**
   * Get detailed information for a specific stock
   */
  async getStockDetails(
    symbol: string,
    options: RequestOptions = {}
  ): Promise<StockData> {
    const cacheKey = CACHE_KEYS.stocks.details(symbol);
    
    // Check cache first
    const cached = this.cache.get<StockDetailsDto>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return this.transformStockDetails(cached);
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      cache: { key: cacheKey, ttl: CACHE_TTL.stockDetails },
      ...options
    };

    const response = await httpClient.get<StockDetailsDto>(
      API_ENDPOINTS.stocks.details(symbol),
      requestOptions
    );

    // Cache the response
    this.cache.set(cacheKey, response, requestOptions.cache);

    return this.transformStockDetails(response);
  }

  /**
   * Search stocks by symbol or name
   */
  async searchStocks(
    query: string,
    limit: number = 10,
    options: RequestOptions = {}
  ): Promise<StockData[]> {
    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.search,
      ...options,
      params: { q: query, limit }
    };

    const response = await httpClient.get<StockSummaryDto[]>(
      API_ENDPOINTS.stocks.search,
      requestOptions
    );

    return response.map(dto => this.transformStock(dto));
  }

  /**
   * Get historical price data for a stock
   */
  async getStockPrices(
    symbol: string,
    request: PriceRangeRequest = {},
    options: RequestOptions = {}
  ): Promise<StockPrice[]> {
    const timeframe = request.timeframe || '1D';
    const cacheKey = CACHE_KEYS.stocks.prices(symbol, timeframe);
      // For real-time data, use shorter cache time
    const ttl = timeframe === '1D' // Short-term data uses shorter cache
      ? CACHE_TTL.realtimePrices 
      : CACHE_TTL.stockPrices;

    // Check cache first
    const cached = this.cache.get<StockPriceDto[]>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return this.transformStockPrices(cached);
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      cache: { key: cacheKey, ttl },
      ...options,
      params: request
    };

    const response = await httpClient.get<StockPriceDto[]>(
      API_ENDPOINTS.stocks.prices(symbol),
      requestOptions
    );

    // Cache the response
    this.cache.set(cacheKey, response, requestOptions.cache);

    return this.transformStockPrices(response);
  }

  /**
   * Get current real-time price for a stock
   */
  async getCurrentPrice(
    symbol: string,
    options: RequestOptions = {}
  ): Promise<StockPrice> {
    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.realtime,
      cache: { key: `current-price:${symbol}`, ttl: CACHE_TTL.realtimePrices },
      ...options
    };

    const response = await httpClient.get<StockPriceDto>(
      API_ENDPOINTS.stocks.currentPrice(symbol),
      requestOptions
    );

    return this.transformStockPrice(response);
  }

  /**
   * Get historical data with technical indicators
   */
  async getHistoricalData(
    symbol: string,
    request: PriceRangeRequest = {},
    options: RequestOptions = {}
  ): Promise<{
    prices: StockPrice[];
    technicalIndicators?: Record<string, number[]>;
  }> {
    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      ...options,
      params: { ...request, includeTechnicalIndicators: true }
    };

    const response = await httpClient.get<{
      prices: StockPriceDto[];
      technicalIndicators?: Record<string, number[]>;
    }>(
      API_ENDPOINTS.stocks.historical(symbol),
      requestOptions
    );

    return {
      prices: this.transformStockPrices(response.prices),
      technicalIndicators: response.technicalIndicators
    };
  }

  /**
   * Get technical indicators for a stock
   */
  async getTechnicalIndicators(
    symbol: string,
    options: RequestOptions = {}
  ): Promise<Record<string, number[]>> {
    const cacheKey = CACHE_KEYS.stocks.technicalIndicators(symbol);
    
    const cached = this.cache.get<Record<string, number[]>>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return cached;
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      cache: { key: cacheKey, ttl: CACHE_TTL.technicalIndicators },
      ...options
    };

    const response = await httpClient.get<Record<string, number[]>>(
      API_ENDPOINTS.stocks.technicalIndicators(symbol),
      requestOptions
    );

    this.cache.set(cacheKey, response, requestOptions.cache);
    return response;
  }

  /**
   * Clear cache for specific stock or all stocks
   */
  clearCache(symbol?: string): void {
    if (symbol) {
      this.cache.clearByTag(`stocks:${symbol}`);
    } else {
      this.cache.clearByTag('stocks:');
    }
  }

  // Private transformation methods
  private transformStocksList(response: PagedResult<StockSummaryDto>): PagedResult<StockData> {
    return {
      ...response,
      items: response.items.map(dto => this.transformStock(dto))
    };
  }

  private transformStock(dto: StockSummaryDto): StockData {
    return {
      symbol: dto.symbol,
      name: dto.name,
      sector: dto.sector,
      exchange: dto.exchange,
      currentPrice: dto.price || 0,
      change: dto.change || 0,
      changePercent: dto.changePercent || 0,
      volume: dto.volume || 0,
      marketCap: dto.marketCap,      lastUpdated: new Date(dto.lastUpdated),
      prices: [], // Will be populated when price data is fetched
      priceHistory: [], // Will be populated with OHLCV data
      technicalIndicators: {},
      timeframe: '1D'
    };
  }

  private transformStockDetails(dto: StockDetailsDto): StockData {
    const baseStock = this.transformStock(dto);
    
    return {
      ...baseStock,
      description: dto.description,
      industry: dto.industry,
      employees: dto.employees,
      headquarters: dto.headquarters,
      website: dto.website,
      founded: dto.founded,
      ceo: dto.ceo,
      dividendYield: dto.dividendYield,
      peRatio: dto.peRatio,
      pbRatio: dto.pbRatio,
      eps: dto.epsttm,
      beta: dto.beta,
      week52High: dto.week52High,
      week52Low: dto.week52Low,
      averageVolume: dto.averageVolume,
      sharesOutstanding: dto.sharesOutstanding
    };
  }

  private transformStockPrices(dtos: StockPriceDto[]): StockPrice[] {
    return dtos.map(dto => this.transformStockPrice(dto));
  }

  private transformStockPrice(dto: StockPriceDto): StockPrice {
    return {
      symbol: dto.symbol,
      timestamp: new Date(dto.date),
      open: dto.open,
      high: dto.high,
      low: dto.low,
      close: dto.close,
      volume: dto.volume,
      adjustedClose: dto.adjustedClose
    };
  }
}

// Export singleton instance
export const stocksApiService = new StocksApiService();
