import type { StockData, Timeframe, MarketData } from './FinancialTypes';

export interface FinancialDataState {
  stocks: Record<string, StockData>;
  watchlist: string[];
  selectedSymbol: string | null;
  timeframe: Timeframe;
  loading: {
    stocks: Record<string, boolean>;
    global: boolean;
  };
  errors: {
    stocks: Record<string, string | null>;
    global: string | null;
  };
  cache: {
    lastFetch: Record<string, Date>;
    ttl: number; // Time to live in milliseconds
  };
  preferences: {
    theme: 'light' | 'dark';
    defaultTimeframe: Timeframe;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  marketData: MarketData | null;
}

export interface FinancialDataActions {
  loadStock: (symbol: string, timeframe?: Timeframe) => Promise<void>;
  loadMultipleStocks: (symbols: string[], timeframe?: Timeframe) => Promise<void>;
  setSelectedSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  updatePreferences: (preferences: Partial<FinancialDataState['preferences']>) => void;
  clearErrors: () => void;
  refreshStock: (symbol: string) => Promise<void>;
  refreshWatchlist: () => Promise<void>;
  loadMarketData: () => Promise<void>;
}

export interface FinancialDataContextValue {
  state: FinancialDataState;
  actions: FinancialDataActions;
}

// Action types for reducer
export type FinancialDataAction =
  | { type: 'LOAD_STOCK_START'; payload: { symbol: string } }
  | { type: 'LOAD_STOCK_SUCCESS'; payload: { symbol: string; data: StockData } }
  | { type: 'LOAD_STOCK_ERROR'; payload: { symbol: string; error: string } }
  | { type: 'LOAD_MULTIPLE_STOCKS_START'; payload: { symbols: string[] } }
  | { type: 'LOAD_MULTIPLE_STOCKS_SUCCESS'; payload: { stocks: Record<string, StockData> } }
  | { type: 'LOAD_MULTIPLE_STOCKS_ERROR'; payload: { error: string } }
  | { type: 'SET_SELECTED_SYMBOL'; payload: string }
  | { type: 'SET_TIMEFRAME'; payload: Timeframe }
  | { type: 'ADD_TO_WATCHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<FinancialDataState['preferences']> }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'LOAD_MARKET_DATA_SUCCESS'; payload: MarketData }
  | { type: 'LOAD_MARKET_DATA_ERROR'; payload: string };

// Hook return types
export interface UseStockDataReturn {
  stockData: StockData | null;
  isLoading: boolean;
  error: string | null;
  loadStock: (timeframe?: Timeframe) => Promise<void>;
  symbol: string | null;
}

export interface UseWatchlistReturn {
  watchlist: string[];
  watchlistData: Array<{
    symbol: string;
    data: StockData | undefined;
    isLoading: boolean;
    error: string | null;
  }>;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  refreshWatchlist: () => Promise<void>;
  isInWatchlist: (symbol: string) => boolean;
}

export interface UseMarketDataReturn {
  marketData: MarketData | null;
  marketSummary: {
    totalStocks: number;
    totalVolume: number;
    averagePrice: number;
    lastUpdated: number;
  } | null;
  totalStocks: number;
  isMarketOpen: boolean;
  loadMarketData: () => Promise<void>;
}
