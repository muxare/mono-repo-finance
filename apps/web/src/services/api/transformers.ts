/**
 * Request/Response Transformers
 * Handles data transformation and normalization for API requests and responses
 */

import type {
  StockSummaryDto,
  StockDetailDto,
  StockPriceDto,
  OHLCVDto,
  SectorDto,
  ExchangeDto,
  PaginationMetadata,
  PagedResult
} from '../../types/ApiTypes';

// =============================================================================
// Request Transformers
// =============================================================================

/**
 * Transform stock query parameters for API compatibility
 */
export function transformStockQueryParams(params: any): Record<string, any> {
  const transformed: Record<string, any> = {};

  // Handle pagination
  if (params.page !== undefined) transformed.page = Math.max(1, params.page);
  if (params.pageSize !== undefined) transformed.pageSize = Math.min(100, Math.max(1, params.pageSize));

  // Handle sorting
  if (params.sortBy) {
    transformed.sortBy = params.sortBy;
    if (params.sortDirection) {
      transformed.sortDirection = params.sortDirection.toLowerCase() === 'desc' ? 'desc' : 'asc';
    }
  }

  // Handle filters
  if (params.sector) transformed.sector = params.sector;
  if (params.exchange) transformed.exchange = params.exchange;
  if (params.search) transformed.search = params.search.trim();
  
  // Handle price range filters
  if (params.minPrice !== undefined) transformed.minPrice = Math.max(0, params.minPrice);
  if (params.maxPrice !== undefined) transformed.maxPrice = Math.max(0, params.maxPrice);
  
  // Handle market cap filters
  if (params.minMarketCap !== undefined) transformed.minMarketCap = Math.max(0, params.minMarketCap);
  if (params.maxMarketCap !== undefined) transformed.maxMarketCap = Math.max(0, params.maxMarketCap);

  return transformed;
}

/**
 * Transform date range parameters
 */
export function transformDateRangeParams(params: any): Record<string, any> {
  const transformed: Record<string, any> = {};

  if (params.startDate) {
    const date = new Date(params.startDate);
    if (!isNaN(date.getTime())) {
      transformed.startDate = date.toISOString().split('T')[0];
    }
  }

  if (params.endDate) {
    const date = new Date(params.endDate);
    if (!isNaN(date.getTime())) {
      transformed.endDate = date.toISOString().split('T')[0];
    }
  }

  if (params.period) {
    transformed.period = params.period;
  }

  if (params.interval) {
    transformed.interval = params.interval;
  }

  return transformed;
}

// =============================================================================
// Response Transformers
// =============================================================================

/**
 * Transform and normalize stock summary data
 */
export function transformStockSummary(stock: any): StockSummaryDto {
  return {
    symbol: String(stock.symbol || stock.Symbol || '').toUpperCase(),
    companyName: String(stock.companyName || stock.CompanyName || stock.name || ''),
    sector: String(stock.sector || stock.Sector || ''),
    exchange: String(stock.exchange || stock.Exchange || ''),
    price: parseFloat(stock.price || stock.Price || stock.currentPrice || 0),
    change: parseFloat(stock.change || stock.Change || stock.priceChange || 0),
    changePercent: parseFloat(stock.changePercent || stock.ChangePercent || stock.priceChangePercent || 0),
    volume: parseInt(stock.volume || stock.Volume || stock.dailyVolume || 0),
    marketCap: parseFloat(stock.marketCap || stock.MarketCap || stock.marketCapitalization || 0),
    lastUpdated: stock.lastUpdated || stock.LastUpdated || new Date().toISOString()
  };
}

/**
 * Transform and normalize stock detail data
 */
export function transformStockDetail(stock: any): StockDetailDto {
  const summary = transformStockSummary(stock);
  
  return {
    ...summary,
    description: String(stock.description || stock.Description || ''),
    employees: parseInt(stock.employees || stock.Employees || stock.employeeCount || 0),
    founded: parseInt(stock.founded || stock.Founded || stock.foundedYear || 0),
    headquarters: String(stock.headquarters || stock.Headquarters || stock.hq || ''),
    website: String(stock.website || stock.Website || stock.webUrl || ''),
    ceo: String(stock.ceo || stock.CEO || stock.chiefExecutive || ''),
    
    // Financial metrics
    peRatio: parseFloat(stock.peRatio || stock.PERatio || stock.pe || 0),
    pbRatio: parseFloat(stock.pbRatio || stock.PBRatio || stock.pb || 0),
    eps: parseFloat(stock.eps || stock.EPS || stock.earningsPerShare || 0),
    dividend: parseFloat(stock.dividend || stock.Dividend || stock.dividendYield || 0),
    beta: parseFloat(stock.beta || stock.Beta || 0),
    
    // Price metrics
    fiftyTwoWeekHigh: parseFloat(stock.fiftyTwoWeekHigh || stock.FiftyTwoWeekHigh || stock['52WeekHigh'] || 0),
    fiftyTwoWeekLow: parseFloat(stock.fiftyTwoWeekLow || stock.FiftyTwoWeekLow || stock['52WeekLow'] || 0),
    avgVolume: parseInt(stock.avgVolume || stock.AvgVolume || stock.averageVolume || 0),
    
    // Additional metrics
    bookValue: parseFloat(stock.bookValue || stock.BookValue || 0),
    priceToBook: parseFloat(stock.priceToBook || stock.PriceToBook || stock.pbRatio || 0),
    debtToEquity: parseFloat(stock.debtToEquity || stock.DebtToEquity || 0),
    returnOnEquity: parseFloat(stock.returnOnEquity || stock.ReturnOnEquity || stock.roe || 0),
    
    lastUpdated: stock.lastUpdated || stock.LastUpdated || new Date().toISOString()
  };
}

/**
 * Transform and normalize stock price data
 */
export function transformStockPrice(price: any): StockPriceDto {
  return {
    symbol: String(price.symbol || price.Symbol || '').toUpperCase(),
    date: price.date || price.Date || price.timestamp || new Date().toISOString(),
    open: parseFloat(price.open || price.Open || 0),
    high: parseFloat(price.high || price.High || 0),
    low: parseFloat(price.low || price.Low || 0),
    close: parseFloat(price.close || price.Close || price.price || 0),
    adjClose: parseFloat(price.adjClose || price.AdjClose || price.adjustedClose || price.close || price.Close || 0),
    volume: parseInt(price.volume || price.Volume || 0)
  };
}

/**
 * Transform and normalize OHLCV data
 */
export function transformOHLCV(data: any): OHLCVDto {
  return {
    date: data.date || data.Date || data.timestamp || new Date().toISOString(),
    open: parseFloat(data.open || data.Open || 0),
    high: parseFloat(data.high || data.High || 0),
    low: parseFloat(data.low || data.Low || 0),
    close: parseFloat(data.close || data.Close || 0),
    volume: parseInt(data.volume || data.Volume || 0)
  };
}

/**
 * Transform and normalize sector data
 */
export function transformSector(sector: any): SectorDto {
  return {
    id: parseInt(sector.id || sector.Id || sector.sectorId || 0),
    name: String(sector.name || sector.Name || sector.sectorName || ''),
    description: String(sector.description || sector.Description || ''),
    stockCount: parseInt(sector.stockCount || sector.StockCount || sector.numberOfStocks || 0)
  };
}

/**
 * Transform and normalize exchange data
 */
export function transformExchange(exchange: any): ExchangeDto {
  return {
    id: parseInt(exchange.id || exchange.Id || exchange.exchangeId || 0),
    name: String(exchange.name || exchange.Name || exchange.exchangeName || ''),
    code: String(exchange.code || exchange.Code || exchange.exchangeCode || '').toUpperCase(),
    country: String(exchange.country || exchange.Country || ''),
    timezone: String(exchange.timezone || exchange.Timezone || exchange.timeZone || ''),
    stockCount: parseInt(exchange.stockCount || exchange.StockCount || exchange.numberOfStocks || 0)
  };
}

/**
 * Transform pagination metadata
 */
export function transformPaginationMetadata(meta: any): PaginationMetadata {
  return {
    page: parseInt(meta.page || meta.Page || meta.currentPage || 1),
    pageSize: parseInt(meta.pageSize || meta.PageSize || meta.size || 10),
    totalItems: parseInt(meta.totalItems || meta.TotalItems || meta.total || meta.totalCount || 0),
    totalPages: parseInt(meta.totalPages || meta.TotalPages || meta.pageCount || 0),
    hasNextPage: Boolean(meta.hasNextPage || meta.HasNextPage || meta.hasNext),
    hasPreviousPage: Boolean(meta.hasPreviousPage || meta.HasPreviousPage || meta.hasPrevious)
  };
}

/**
 * Transform paginated result
 */
export function transformPagedResult<T>(
  data: any,
  itemTransformer: (item: any) => T
): PagedResult<T> {
  const items = Array.isArray(data.items || data.Items || data.data || data.Data) 
    ? (data.items || data.Items || data.data || data.Data).map(itemTransformer)
    : [];

  const pagination = transformPaginationMetadata(data.pagination || data.Pagination || data.meta || data);

  return {
    items,
    pagination
  };
}

// =============================================================================
// Collection Transformers
// =============================================================================

/**
 * Transform array of stock summaries
 */
export function transformStockSummaries(stocks: any[]): StockSummaryDto[] {
  return Array.isArray(stocks) ? stocks.map(transformStockSummary) : [];
}

/**
 * Transform array of stock prices
 */
export function transformStockPrices(prices: any[]): StockPriceDto[] {
  return Array.isArray(prices) ? prices.map(transformStockPrice) : [];
}

/**
 * Transform array of OHLCV data
 */
export function transformOHLCVArray(data: any[]): OHLCVDto[] {
  return Array.isArray(data) ? data.map(transformOHLCV) : [];
}

/**
 * Transform array of sectors
 */
export function transformSectors(sectors: any[]): SectorDto[] {
  return Array.isArray(sectors) ? sectors.map(transformSector) : [];
}

/**
 * Transform array of exchanges
 */
export function transformExchanges(exchanges: any[]): ExchangeDto[] {
  return Array.isArray(exchanges) ? exchanges.map(transformExchange) : [];
}

// =============================================================================
// Data Validation
// =============================================================================

/**
 * Validate and sanitize stock symbol
 */
export function validateSymbol(symbol: any): string {
  const cleaned = String(symbol || '').trim().toUpperCase();
  if (!/^[A-Z]{1,10}$/.test(cleaned)) {
    throw new Error(`Invalid stock symbol: ${symbol}`);
  }
  return cleaned;
}

/**
 * Validate date parameter
 */
export function validateDate(date: any): Date {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  return parsed;
}

/**
 * Validate numeric parameter
 */
export function validateNumber(value: any, min?: number, max?: number): number {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  if (min !== undefined && num < min) {
    throw new Error(`Number ${num} is below minimum ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new Error(`Number ${num} is above maximum ${max}`);
  }
  return num;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Deep clone an object (for safe transformations)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map(deepClone) as any;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Remove null and undefined values from an object
 */
export function removeNullish(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(removeNullish).filter(item => item !== null && item !== undefined);
  }
  
  const cleaned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = removeNullish(obj[key]);
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}
