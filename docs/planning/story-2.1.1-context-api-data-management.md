# Story 2.1.1: Context API Data Management Setup

## 📋 Story Overview
- **Epic**: Frontend Chart Components & Visualization
- **Story ID**: 2.1.1
- **Priority**: High
- **Story Points**: 5
- **Sprint**: 3

## 🎯 User Story
**As a** frontend developer  
**I want** a robust Context API-based data management system  
**So that** I can efficiently manage and share financial data state across chart components

## 📝 Acceptance Criteria

### Context Architecture Setup
- [ ] Create a centralized `FinancialDataContext` for stock data management
- [ ] Implement provider pattern with proper TypeScript typing
- [ ] Set up state structure for multiple stocks, timeframes, and calculations
- [ ] Create custom hooks for consuming context data (`useStockData`, `useMarketData`)
- [ ] Implement loading, error, and cache states management

### State Management Strategy
- [ ] Design normalized state structure for efficient updates
- [ ] Implement immutable state updates with proper React patterns
- [ ] Create selectors for derived data (filtered timeframes, computed metrics)
- [ ] Set up state persistence for user preferences and cached data
- [ ] Implement optimistic updates for better UX

### Performance Optimizations
- [ ] Use `useMemo` and `useCallback` for expensive computations
- [ ] Implement context splitting to prevent unnecessary re-renders
- [ ] Create granular contexts for different data domains
- [ ] Set up proper dependency arrays for hooks
- [ ] Implement virtual scrolling support for large datasets

## 🛠️ Technical Implementation

### 1. Context Structure Design

```typescript
// types/FinancialContextTypes.ts
export interface StockData {
  symbol: string;
  currentPrice: number;
  priceHistory: OHLCV[];
  volume: number;
  lastUpdated: Date;
  indicators?: {
    sma?: number[];
    ema?: number[];
    rsi?: number[];
    macd?: MACDData;
  };
}

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
}

export interface FinancialDataContextValue {
  state: FinancialDataState;
  actions: {
    loadStock: (symbol: string, timeframe?: Timeframe) => Promise<void>;
    setSelectedSymbol: (symbol: string) => void;
    setTimeframe: (timeframe: Timeframe) => void;
    addToWatchlist: (symbol: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    updatePreferences: (preferences: Partial<FinancialDataState['preferences']>) => void;
    clearErrors: () => void;
    refreshStock: (symbol: string) => Promise<void>;
  };
}
```

### 2. Context Provider Implementation

```typescript
// contexts/FinancialDataContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

const FinancialDataContext = createContext<FinancialDataContextValue | undefined>(undefined);

// Action types for reducer
type FinancialDataAction =
  | { type: 'LOAD_STOCK_START'; payload: { symbol: string } }
  | { type: 'LOAD_STOCK_SUCCESS'; payload: { symbol: string; data: StockData } }
  | { type: 'LOAD_STOCK_ERROR'; payload: { symbol: string; error: string } }
  | { type: 'SET_SELECTED_SYMBOL'; payload: string }
  | { type: 'SET_TIMEFRAME'; payload: Timeframe }
  | { type: 'ADD_TO_WATCHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<FinancialDataState['preferences']> }
  | { type: 'CLEAR_ERRORS' };

const financialDataReducer = (
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

    default:
      return state;
  }
};

const initialState: FinancialDataState = {
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
};

export const FinancialDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financialDataReducer, initialState);

  // Implementation of action creators would go here...
  // This is where we'll integrate with the backend API service from Story 2.1.2

  const contextValue: FinancialDataContextValue = {
    state,
    actions: {
      // Action implementations...
    },
  };

  return (
    <FinancialDataContext.Provider value={contextValue}>
      {children}
    </FinancialDataContext.Provider>
  );
};
```

### 3. Custom Hooks Implementation

```typescript
// hooks/useFinancialData.ts
export const useFinancialData = () => {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};

// hooks/useStockData.ts
export const useStockData = (symbol?: string) => {
  const { state, actions } = useFinancialData();
  const targetSymbol = symbol || state.selectedSymbol;

  const stockData = useMemo(() => {
    return targetSymbol ? state.stocks[targetSymbol] : null;
  }, [state.stocks, targetSymbol]);

  const isLoading = useMemo(() => {
    return targetSymbol ? state.loading.stocks[targetSymbol] || false : false;
  }, [state.loading.stocks, targetSymbol]);

  const error = useMemo(() => {
    return targetSymbol ? state.errors.stocks[targetSymbol] : null;
  }, [state.errors.stocks, targetSymbol]);

  const loadStock = useCallback(
    (timeframe?: Timeframe) => {
      if (targetSymbol) {
        return actions.loadStock(targetSymbol, timeframe);
      }
      return Promise.resolve();
    },
    [actions, targetSymbol]
  );

  return {
    stockData,
    isLoading,
    error,
    loadStock,
    symbol: targetSymbol,
  };
};

// hooks/useWatchlist.ts
export const useWatchlist = () => {
  const { state, actions } = useFinancialData();

  const watchlistData = useMemo(() => {
    return state.watchlist.map(symbol => ({
      symbol,
      data: state.stocks[symbol],
      isLoading: state.loading.stocks[symbol] || false,
      error: state.errors.stocks[symbol],
    }));
  }, [state.watchlist, state.stocks, state.loading.stocks, state.errors.stocks]);

  return {
    watchlist: state.watchlist,
    watchlistData,
    addToWatchlist: actions.addToWatchlist,
    removeFromWatchlist: actions.removeFromWatchlist,
  };
};

// hooks/useMarketData.ts
export const useMarketData = () => {
  const { state } = useFinancialData();

  const marketSummary = useMemo(() => {
    const allStocks = Object.values(state.stocks);
    if (allStocks.length === 0) return null;

    const totalVolume = allStocks.reduce((sum, stock) => sum + stock.volume, 0);
    const avgPrice = allStocks.reduce((sum, stock) => sum + stock.currentPrice, 0) / allStocks.length;
    
    return {
      totalStocks: allStocks.length,
      totalVolume,
      averagePrice: avgPrice,
      lastUpdated: Math.max(...allStocks.map(stock => stock.lastUpdated.getTime())),
    };
  }, [state.stocks]);

  return {
    marketSummary,
    totalStocks: Object.keys(state.stocks).length,
    isMarketOpen: true, // This would be calculated based on market hours
  };
};
```

### 4. Context Optimization Strategies

```typescript
// contexts/OptimizedContexts.tsx
// Split contexts to prevent unnecessary re-renders

// 1. Data Context (stocks, prices, indicators)
const FinancialDataContext = createContext<FinancialDataContextValue | undefined>(undefined);

// 2. UI State Context (selected symbol, timeframe, preferences)
const FinancialUIContext = createContext<FinancialUIContextValue | undefined>(undefined);

// 3. Cache Context (loading states, errors, cache metadata)
const FinancialCacheContext = createContext<FinancialCacheContextValue | undefined>(undefined);

// Combined provider that manages all three contexts
export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementation that provides all three contexts
  return (
    <FinancialCacheContext.Provider value={cacheValue}>
      <FinancialUIContext.Provider value={uiValue}>
        <FinancialDataContext.Provider value={dataValue}>
          {children}
        </FinancialDataContext.Provider>
      </FinancialUIContext.Provider>
    </FinancialCacheContext.Provider>
  );
};
```

## 📋 Implementation Report & Decision Logic

### Context API Design Decisions

#### 1. **Single vs Multiple Contexts**
**Decision**: Implement a hybrid approach with a primary context and optional split contexts for performance.

**Logic**: 
- Single context provides simplicity and easier debugging
- Context splitting can be added later if performance issues arise
- Start with one context and measure performance before optimizing
- Use selectors within hooks to minimize re-renders

#### 2. **State Structure Normalization**
**Decision**: Use normalized state with entities stored by symbol key.

**Logic**:
- Faster lookups by symbol (O(1) vs O(n))
- Easier updates to individual stocks without affecting others
- Better support for real-time updates
- Reduces memory footprint for large datasets
- Follows Redux patterns familiar to many developers

#### 3. **Reducer vs useState Pattern**
**Decision**: Use `useReducer` for complex state management.

**Logic**:
- More predictable state updates with action types
- Better debugging with Redux DevTools
- Easier testing of state transitions
- Complex state logic centralized in reducer
- Type safety with discriminated union action types

#### 4. **Caching Strategy**
**Decision**: Implement TTL-based caching with configurable expiration.

**Logic**:
- Reduces unnecessary API calls
- Improves performance for frequently accessed data
- User can configure refresh behavior
- Supports both manual and automatic refresh
- Balances data freshness with performance

#### 5. **Error Handling Approach**
**Decision**: Granular error states per stock symbol plus global errors.

**Logic**:
- Users can see specific failures without affecting other data
- Supports partial loading states (some stocks load, others fail)
- Better UX with targeted error messages
- Allows retry of individual failed requests
- Supports different error types (network, API, validation)

#### 6. **Hook Composition Strategy**
**Decision**: Create specialized hooks for different use cases.

**Logic**:
- Better separation of concerns
- Each hook has a single responsibility
- Easier to test individual hook behaviors
- More reusable across different components
- Cleaner component code with focused data needs

### Performance Considerations

#### 1. **Memoization Strategy**
- Use `useMemo` for expensive calculations (market summaries, derived data)
- Use `useCallback` for action creators to prevent unnecessary re-renders
- Implement selectors to compute derived state efficiently
- Cache expensive transformations at the hook level

#### 2. **Re-render Optimization**
- Split large contexts into smaller, focused contexts if needed
- Use React.memo for components that receive context data
- Implement shallow equality checks for context values
- Use object references consistently to prevent false re-renders

#### 3. **Memory Management**
- Implement cleanup for old stock data
- Set reasonable limits on cached data size
- Clear errors and loading states after resolution
- Use weak references for temporary computations

## 🔧 Technical Tasks

### Phase 1: Core Context Setup (Week 1)
- [ ] Create TypeScript interfaces for all state shapes
- [ ] Implement basic `FinancialDataContext` with reducer
- [ ] Create provider component with initial state
- [ ] Build fundamental custom hooks (`useFinancialData`, `useStockData`)
- [ ] Add basic error boundaries for context errors

### Phase 2: State Management Features (Week 2)  
- [ ] Implement watchlist management functionality
- [ ] Add preferences and settings state management
- [ ] Create caching logic with TTL expiration
- [ ] Build loading state management for multiple stocks
- [ ] Add optimistic updates for better UX

### Phase 3: Advanced Hooks and Optimization (Week 3)
- [ ] Create specialized hooks (`useWatchlist`, `useMarketData`)
- [ ] Implement state selectors for derived data
- [ ] Add performance monitoring and optimization
- [ ] Create dev tools integration for debugging
- [ ] Add comprehensive error handling and recovery

### Phase 4: Integration Preparation (Week 4)
- [ ] Prepare integration points for API service (Story 2.1.2)
- [ ] Create mock data providers for development
- [ ] Add TypeScript documentation and examples
- [ ] Implement testing utilities for context providers
- [ ] Create migration path for existing component state

## 🧪 Testing Strategy

### Unit Tests
- Context reducer logic with all action types
- Custom hooks behavior with React Testing Library
- State selector functions and memoization
- Error handling scenarios and edge cases

### Integration Tests  
- Provider component with multiple consumers
- Context updates across component tree
- Performance characteristics with large datasets
- Error boundaries and recovery behavior

### Developer Experience Tests
- TypeScript compilation and type checking
- Hook usage patterns and documentation
- Context debugging and inspection tools
- Performance profiling and optimization verification

## 📈 Success Metrics
- [ ] Context setup completed without runtime errors
- [ ] All custom hooks properly typed and documented
- [ ] State updates perform under 16ms for smooth UI
- [ ] Memory usage remains stable with 100+ stocks
- [ ] Developer reports improved data management experience

## 🔗 Dependencies
- **Story 2.1.2**: Backend Request Infrastructure (for API integration)
- **Story 1.4**: Data Calculation Service (for backend data structure)

## 🚀 Next Steps
After completion, this context system will provide the foundation for:
- **Story 2.1.2**: Backend API service integration
- **Story 2.1.3**: D3.js chart component data consumption
- **Story 2.2**: Real-time data updates via WebSocket
- **Story 3.1**: Stock search and symbol management
