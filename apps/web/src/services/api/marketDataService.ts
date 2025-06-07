/**
 * Market Data API Service - Handles market-wide data operations
 */

import type { RequestOptions } from '../../types/ApiTypes';
import type { MarketData } from '../../types/FinancialTypes';
import { httpClient } from './httpClient';
import { cacheManager, CacheManager } from './cacheManager';
import { API_ENDPOINTS, CACHE_KEYS, CACHE_TTL, REQUEST_TIMEOUTS } from './config';

// API DTOs for market data
export interface SectorDto {
  id: number;
  name: string;
  description?: string;
  stockCount: number;
  averageMarketCap?: number;
  topPerformer?: string;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

export interface ExchangeDto {
  id: number;
  name: string;
  symbol: string;
  country: string;
  timezone: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  stockCount: number;
}

export interface MarketSummaryDto {
  indices: {
    sp500: {
      value: number;
      change: number;
      changePercent: number;
    };
    nasdaq: {
      value: number;
      change: number;
      changePercent: number;
    };
    dow: {
      value: number;
      change: number;
      changePercent: number;
    };
  };
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  volume: {
    total: number;
    advancers: number;
    decliners: number;
    unchanged: number;
  };
  lastUpdated: string;
}

export interface MarketMoversDto {
  gainers: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
  }>;
  losers: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
  }>;
  mostActive: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
  }>;
}

export class MarketDataApiService {
  private cache: CacheManager;

  constructor(cache: CacheManager = cacheManager) {
    this.cache = cache;
  }

  /**
   * Get all market sectors with performance data
   */
  async getSectors(options: RequestOptions = {}): Promise<SectorDto[]> {
    const cacheKey = CACHE_KEYS.market.sectors;
    
    // Check cache first
    const cached = this.cache.get<SectorDto[]>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return cached;
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      cache: { key: cacheKey, ttl: CACHE_TTL.sectors },
      ...options
    };

    const response = await httpClient.get<SectorDto[]>(
      API_ENDPOINTS.market.sectors,
      requestOptions
    );

    // Cache the response
    this.cache.set(cacheKey, response, requestOptions.cache);

    return response;
  }

  /**
   * Get all exchanges with status information
   */
  async getExchanges(options: RequestOptions = {}): Promise<ExchangeDto[]> {
    const cacheKey = CACHE_KEYS.market.exchanges;
    
    // Check cache first
    const cached = this.cache.get<ExchangeDto[]>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return cached;
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      cache: { key: cacheKey, ttl: CACHE_TTL.exchanges },
      ...options
    };

    const response = await httpClient.get<ExchangeDto[]>(
      API_ENDPOINTS.market.exchanges,
      requestOptions
    );

    // Cache the response
    this.cache.set(cacheKey, response, requestOptions.cache);

    return response;
  }

  /**
   * Get market indices and overall market status
   */
  async getMarketSummary(options: RequestOptions = {}): Promise<MarketData> {
    const cacheKey = CACHE_KEYS.market.summary;
    
    // For market summary, use shorter cache for real-time updates
    const cached = this.cache.get<MarketSummaryDto>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return this.transformMarketSummary(cached);
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.realtime,
      cache: { key: cacheKey, ttl: CACHE_TTL.marketSummary },
      ...options
    };

    const response = await httpClient.get<MarketSummaryDto>(
      API_ENDPOINTS.market.summary,
      requestOptions
    );

    // Cache the response
    this.cache.set(cacheKey, response, requestOptions.cache);

    return this.transformMarketSummary(response);
  }

  /**
   * Get market indices data
   */
  async getIndices(options: RequestOptions = {}): Promise<MarketSummaryDto['indices']> {
    const cacheKey = CACHE_KEYS.market.indices;
    
    const cached = this.cache.get<MarketSummaryDto['indices']>(cacheKey);
    if (cached && !options.cache?.ttl) {
      return cached;
    }

    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.realtime,
      cache: { key: cacheKey, ttl: CACHE_TTL.marketSummary },
      ...options
    };

    const response = await httpClient.get<MarketSummaryDto['indices']>(
      API_ENDPOINTS.market.indices,
      requestOptions
    );

    this.cache.set(cacheKey, response, requestOptions.cache);
    return response;
  }

  /**
   * Get market movers (gainers, losers, most active)
   */
  async getMarketMovers(options: RequestOptions = {}): Promise<MarketMoversDto> {
    const requestOptions: RequestOptions = {
      timeout: REQUEST_TIMEOUTS.default,
      cache: { key: 'market:movers', ttl: CACHE_TTL.marketSummary },
      ...options
    };

    const response = await httpClient.get<MarketMoversDto>(
      API_ENDPOINTS.market.movers,
      requestOptions
    );

    return response;
  }

  /**
   * Get sector performance data
   */
  async getSectorPerformance(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    options: RequestOptions = {}
  ): Promise<Array<{ sector: string; performance: number; stocks: number }>> {
    const sectors = await this.getSectors(options);
    
    return sectors.map(sector => ({
      sector: sector.name,
      performance: sector.performance[period],
      stocks: sector.stockCount
    }));
  }

  /**
   * Check if market is currently open
   */
  async isMarketOpen(options: RequestOptions = {}): Promise<boolean> {
    const summary = await this.getMarketSummary(options);
    return summary.marketStatus === 'open';
  }

  /**
   * Get market status with detailed information
   */
  async getMarketStatus(options: RequestOptions = {}): Promise<{
    status: string;
    nextOpen?: Date;
    nextClose?: Date;
    timezone: string;
  }> {
    const summary = await this.getMarketSummary(options);
    
    // This would typically come from the backend
    // For now, we'll provide a basic implementation
    return {
      status: summary.marketStatus,
      timezone: 'America/New_York' // NYSE timezone
    };
  }

  /**
   * Clear market data cache
   */
  clearCache(): void {
    this.cache.clearByTag('market:');
  }

  /**
   * Clear specific cache entries
   */
  clearSectorsCache(): void {
    this.cache.delete(CACHE_KEYS.market.sectors);
  }

  clearExchangesCache(): void {
    this.cache.delete(CACHE_KEYS.market.exchanges);
  }

  clearMarketSummaryCache(): void {
    this.cache.delete(CACHE_KEYS.market.summary);
  }

  // Private transformation methods
  private transformMarketSummary(dto: MarketSummaryDto): MarketData {
    return {
      indices: {
        sp500: dto.indices.sp500.value,
        nasdaq: dto.indices.nasdaq.value,
        dow: dto.indices.dow.value
      },
      marketStatus: dto.marketStatus,
      lastUpdated: new Date(dto.lastUpdated)
    };
  }
}

// Export singleton instance
export const marketDataApiService = new MarketDataApiService();
