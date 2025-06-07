/**
 * Core financial data types for the application
 */

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type TimeFrame = Timeframe; // Alias for compatibility

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Alias for compatibility with services
export interface StockPrice extends OHLCV {
  symbol: string;
  adjustedClose?: number;
}

export interface MACDData {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface TechnicalIndicators {
  sma?: number[];
  ema?: number[];
  rsi?: number[];
  macd?: MACDData;
  bollingerBands?: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
}

export interface StockData {
  symbol: string;
  name: string;
  sector?: string;
  exchange?: string;
  currentPrice: number;
  priceHistory: OHLCV[];
  prices?: StockPrice[]; // For service compatibility
  volume: number;
  lastUpdated: Date;
  change: number;
  changePercent: number;
  indicators?: TechnicalIndicators;
  technicalIndicators?: Record<string, number[]>; // Service compatibility
  timeframe?: Timeframe;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  // Extended properties
  description?: string;
  industry?: string;
  employees?: number;
  headquarters?: string;
  website?: string;
  founded?: number;
  ceo?: string;
  pbRatio?: number;
  eps?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  averageVolume?: number;
  sharesOutstanding?: number;
}

export interface MarketData {
  indices: {
    sp500: number;
    nasdaq: number;
    dow: number;
  };
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  lastUpdated: Date;
}

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
