import type { 
  FinancialDataState, 
  FinancialDataAction 
} from '../types/FinancialContextTypes';

export const financialDataReducer = (
  state: FinancialDataState,
  action: FinancialDataAction
): FinancialDataState => {
  switch (action.type) {
    case 'LOAD_STOCK_START':
      return {
        ...state,
        loading: {
          ...state.loading,
          stocks: {
            ...state.loading.stocks,
            [action.payload.symbol]: true,
          },
        },
        errors: {
          ...state.errors,
          stocks: {
            ...state.errors.stocks,
            [action.payload.symbol]: null,
          },
        },
      };

    case 'LOAD_STOCK_SUCCESS':
      return {
        ...state,
        stocks: {
          ...state.stocks,
          [action.payload.symbol]: action.payload.data,
        },
        loading: {
          ...state.loading,
          stocks: {
            ...state.loading.stocks,
            [action.payload.symbol]: false,
          },
        },
        cache: {
          ...state.cache,
          lastFetch: {
            ...state.cache.lastFetch,
            [action.payload.symbol]: new Date(),
          },
        },
      };

    case 'LOAD_STOCK_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          stocks: {
            ...state.loading.stocks,
            [action.payload.symbol]: false,
          },
        },
        errors: {
          ...state.errors,
          stocks: {
            ...state.errors.stocks,
            [action.payload.symbol]: action.payload.error,
          },
        },
      };

    case 'LOAD_MULTIPLE_STOCKS_START':
      const stocksLoading = action.payload.symbols.reduce((acc, symbol) => {
        acc[symbol] = true;
        return acc;
      }, {} as Record<string, boolean>);

      return {
        ...state,
        loading: {
          ...state.loading,
          global: true,
          stocks: {
            ...state.loading.stocks,
            ...stocksLoading,
          },
        },
      };

    case 'LOAD_MULTIPLE_STOCKS_SUCCESS':
      const stocksLoadingComplete = Object.keys(action.payload.stocks).reduce((acc, symbol) => {
        acc[symbol] = false;
        return acc;
      }, {} as Record<string, boolean>);

      const cacheDates = Object.keys(action.payload.stocks).reduce((acc, symbol) => {
        acc[symbol] = new Date();
        return acc;
      }, {} as Record<string, Date>);

      return {
        ...state,
        stocks: {
          ...state.stocks,
          ...action.payload.stocks,
        },
        loading: {
          ...state.loading,
          global: false,
          stocks: {
            ...state.loading.stocks,
            ...stocksLoadingComplete,
          },
        },
        cache: {
          ...state.cache,
          lastFetch: {
            ...state.cache.lastFetch,
            ...cacheDates,
          },
        },
      };

    case 'LOAD_MULTIPLE_STOCKS_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          global: false,
        },
        errors: {
          ...state.errors,
          global: action.payload.error,
        },
      };

    case 'SET_SELECTED_SYMBOL':
      return {
        ...state,
        selectedSymbol: action.payload,
      };

    case 'SET_TIMEFRAME':
      return {
        ...state,
        timeframe: action.payload,
      };

    case 'ADD_TO_WATCHLIST':
      return {
        ...state,
        watchlist: [...state.watchlist, action.payload].filter(
          (symbol, index, array) => array.indexOf(symbol) === index
        ),
      };

    case 'REMOVE_FROM_WATCHLIST':
      return {
        ...state,
        watchlist: state.watchlist.filter(symbol => symbol !== action.payload),
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {
          stocks: {},
          global: null,
        },
      };

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          global: action.payload,
        },
      };

    case 'LOAD_MARKET_DATA_SUCCESS':
      return {
        ...state,
        marketData: action.payload,
      };

    case 'LOAD_MARKET_DATA_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          global: action.payload,
        },
      };

    default:
      return state;
  }
};

export const initialFinancialDataState: FinancialDataState = {
  stocks: {},
  watchlist: [],
  selectedSymbol: null,
  timeframe: '1M',
  loading: {
    stocks: {},
    global: false,
  },
  errors: {
    stocks: {},
    global: null,
  },
  cache: {
    lastFetch: {},
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  preferences: {
    theme: 'light',
    defaultTimeframe: '1M',
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
  },
  marketData: null,
};
