// API Response Types
export interface ApiResponse<T = any> {
    data: T;
    success: boolean;
    message?: string;
    errors?: string[];
    timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

// Financial Data Types
export interface FinancialDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface StockSymbol {
    symbol: string;
    name: string;
    exchange: string;
    currency: string;
    country: string;
}

export interface MarketData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
    lastUpdated: string;
}

// Chart Configuration Types
export interface ChartDimensions {
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

export interface CandlestickData extends FinancialDataPoint {
    id: string;
}

export interface EmaData {
    date: string;
    value: number;
    period: number;
}

// User & Authentication Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'readonly';
    createdAt: string;
    updatedAt: string;
}

export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
}

// Error Types
export interface AppError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

// Configuration Types
export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export interface AppConfig {
    api: ApiConfig;
    features: {
        realTimeUpdates: boolean;
        darkMode: boolean;
        notifications: boolean;
    };
    chart: {
        defaultTimeframe: string;
        autoRefresh: boolean;
        refreshInterval: number;
    };
}

// Event Types
export interface AppEvent<T = any> {
    type: string;
    payload: T;
    timestamp: string;
    source?: string;
}

export interface WebSocketMessage<T = any> {
    type: 'data' | 'error' | 'status';
    payload: T;
    timestamp: string;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type Theme = 'light' | 'dark' | 'auto';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

// Re-export common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
