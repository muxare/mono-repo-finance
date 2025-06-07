/**
 * Financial Data Service
 * Service layer for financial data API operations
 */

import { ApiClient } from './ApiClient';
import { API_ENDPOINTS, CACHE_TTL } from './config';
import type {
  StockSummaryDto,
  StockDetailDto,
  StockPriceDto,
  OHLCVDto,
  SectorDto,
  ExchangeDto,
  PagedResult,
  StockQueryParameters,
  PriceRangeRequest,
  OHLCRequest,
  ServiceOptions
} from '../../types/ApiTypes';

export class FinancialDataService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // =============================================================================
  // Stock Operations
  // =============================================================================

  /**
   * Get paginated list of stocks with optional filtering
   */
  async getStocks(
    params?: StockQueryParameters,
    options?: ServiceOptions
  ): Promise<PagedResult<StockSummaryDto>> {    return this.apiClient.get<PagedResult<StockSummaryDto>>(
      API_ENDPOINTS.stocks.list,
      {
        params,
        cache: {
          key: `stocks-list-${JSON.stringify(params)}`,
          ttl: CACHE_TTL.stockList / 1000, // Convert to seconds
          tags: ['stocks']
        },
        timeout: options?.timeout,
        signal: options?.signal,
        ...options
      }
    );
  }

  /**
   * Get detailed information for a specific stock
   */
  async getStockDetails(
    symbol: string,
    options?: ServiceOptions
  ): Promise<StockDetailDto> {
    return this.apiClient.get<StockDetailDto>(
      API_ENDPOINTS.stocks.details(symbol),
      {        cache: {
          key: `stock-details-${symbol}`,
          ttl: CACHE_TTL.stockDetails / 1000,
          tags: ['stocks', `stock-${symbol}`]
        },
        timeout: options?.timeout,
        signal: options?.signal,
        ...options
      }
    );
  }

  /**
   * Search stocks by symbol or company name
   */
  async searchStocks(
    query: string,
    options?: ServiceOptions
  ): Promise<StockSummaryDto[]> {
    return this.apiClient.get<StockSummaryDto[]>(
      API_ENDPOINTS.stocks.search,
      {
        params: { q: query },        cache: {
          key: `stock-search-${query}`,
          ttl: CACHE_TTL.stockList / 1000,
          tags: ['stocks', 'search']
        },
        timeout: options?.timeout || 10000, // Shorter timeout for search
        signal: options?.signal,
        ...options
      }
    );
  }

  // =============================================================================
  // Stock Price Operations
  // =============================================================================

  /**
   * Get historical price data for a stock
   */
  async getStockPrices(
    symbol: string,
    params?: PriceRangeRequest,
    options?: ServiceOptions
  ): Promise<StockPriceDto[]> {
    return this.apiClient.get<StockPriceDto[]>(
      API_ENDPOINTS.stocks.prices(symbol),
      {
        params,        cache: {
          key: `stock-prices-${symbol}-${JSON.stringify(params)}`,
          ttl: CACHE_TTL.stockPrices / 1000,
          tags: ['stock-prices', `stock-${symbol}`]
        },
        timeout: options?.timeout,
        signal: options?.signal,
        ...options
      }
    );
  }

  /**
   * Get latest price for a stock
   */
  async getLatestStockPrice(
    symbol: string,
    options?: ServiceOptions
  ): Promise<StockPriceDto> {
    return this.apiClient.get<StockPriceDto>(
      `${API_ENDPOINTS.stocks.prices(symbol)}/latest`,
      {        cache: {
          key: `stock-latest-price-${symbol}`,
          ttl: CACHE_TTL.realtimePrices / 1000,
          tags: ['stock-prices', `stock-${symbol}`, 'latest']
        },
        timeout: options?.timeout || 5000, // Shorter timeout for latest price
        signal: options?.signal,
        ...options
      }
    );
  }

  /**
   * Get OHLC data for charting
   */
  async getOHLCData(
    symbol: string,
    params?: OHLCRequest,
    options?: ServiceOptions
  ): Promise<OHLCVDto[]> {
    return this.apiClient.get<OHLCVDto[]>(
      `${API_ENDPOINTS.stocks.prices(symbol)}/ohlc`,
      {
        params,        cache: {
          key: `stock-ohlc-${symbol}-${JSON.stringify(params)}`,
          ttl: CACHE_TTL.stockPrices / 1000,
          tags: ['stock-prices', `stock-${symbol}`, 'ohlc']
        },
        timeout: options?.timeout,
        signal: options?.signal,
        ...options
      }
    );
  }

  // =============================================================================
  // Market Data Operations
  // =============================================================================

  /**
   * Get all sectors
   */
  async getSectors(options?: ServiceOptions): Promise<SectorDto[]> {
    return this.apiClient.get<SectorDto[]>(
      API_ENDPOINTS.market.sectors,
      {        cache: {
          key: 'market-sectors',
          ttl: CACHE_TTL.sectors / 1000,
          tags: ['market-data', 'sectors']
        },
        timeout: options?.timeout,
        signal: options?.signal,
        ...options
      }
    );
  }

  /**
   * Get all exchanges
   */
  async getExchanges(options?: ServiceOptions): Promise<ExchangeDto[]> {
    return this.apiClient.get<ExchangeDto[]>(
      API_ENDPOINTS.market.exchanges,
      {        cache: {
          key: 'market-exchanges',
          ttl: CACHE_TTL.exchanges / 1000,
          tags: ['market-data', 'exchanges']
        },
        timeout: options?.timeout,
        signal: options?.signal,
        ...options
      }
    );
  }

  // =============================================================================
  // Data Management Operations
  // =============================================================================

  /**
   * Clear cache for specific stock
   */
  clearStockCache(symbol: string): void {
    this.apiClient.clearCache(`stock-${symbol}`);
  }

  /**
   * Clear all stock-related cache
   */
  clearAllStockCache(): void {
    this.apiClient.clearCache('stocks');
    this.apiClient.clearCache('stock-prices');
  }

  /**
   * Clear market data cache
   */
  clearMarketDataCache(): void {
    this.apiClient.clearCache('market-data');
  }

  /**
   * Get performance statistics for the API client
   */
  getPerformanceStats() {
    return this.apiClient.getPerformanceStats();
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return this.apiClient.getRateLimitStatus();
  }

  // =============================================================================
  // Batch Operations
  // =============================================================================

  /**
   * Get multiple stocks' latest prices in parallel
   */
  async getMultipleLatestPrices(
    symbols: string[],
    options?: ServiceOptions
  ): Promise<Record<string, StockPriceDto>> {
    const promises = symbols.map(symbol =>
      this.getLatestStockPrice(symbol, options)
        .then(price => ({ symbol, price }))
        .catch(error => ({ symbol, error }))
    );

    const results = await Promise.allSettled(promises);
    const priceMap: Record<string, StockPriceDto> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && 'price' in result.value) {
        priceMap[symbols[index]] = result.value.price;
      }
    });

    return priceMap;
  }

  /**
   * Get historical data for multiple stocks in parallel
   */
  async getMultipleStockPrices(
    symbols: string[],
    params?: PriceRangeRequest,
    options?: ServiceOptions
  ): Promise<Record<string, StockPriceDto[]>> {
    const promises = symbols.map(symbol =>
      this.getStockPrices(symbol, params, options)
        .then(prices => ({ symbol, prices }))
        .catch(error => ({ symbol, error }))
    );

    const results = await Promise.allSettled(promises);
    const pricesMap: Record<string, StockPriceDto[]> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && 'prices' in result.value) {
        pricesMap[symbols[index]] = result.value.prices;
      }
    });

    return pricesMap;
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  /**
   * Transform OHLC data to format expected by charting libraries
   */
  transformOHLCForChart(data: OHLCVDto[]): Array<{
    x: Date;
    y: [number, number, number, number]; // [open, high, low, close]
    volume: number;
  }> {
    return data.map(item => ({
      x: new Date(item.date),
      y: [item.open, item.high, item.low, item.close],
      volume: item.volume
    }));
  }

  /**
   * Calculate price change percentage
   */
  calculatePriceChange(prices: StockPriceDto[]): number | null {
    if (prices.length < 2) return null;
    
    const latest = prices[prices.length - 1];
    const previous = prices[prices.length - 2];
    
    return ((latest.close - previous.close) / previous.close) * 100;
  }

  /**
   * Get price statistics for a dataset
   */
  getPriceStatistics(prices: StockPriceDto[]): {
    high: number;
    low: number;
    average: number;
    volatility: number;
  } | null {
    if (prices.length === 0) return null;

    const closes = prices.map(p => p.close);
    const high = Math.max(...closes);
    const low = Math.min(...closes);
    const average = closes.reduce((sum, price) => sum + price, 0) / closes.length;
    
    // Calculate volatility (standard deviation)
    const variance = closes.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / closes.length;
    const volatility = Math.sqrt(variance);

    return { high, low, average, volatility };
  }
}
