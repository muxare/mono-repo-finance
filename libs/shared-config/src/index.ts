import type { ApiConfig, AppConfig, Timeframe } from '@monorepo/shared-types';

// Environment variable helper that works in both browser and Node.js
function getEnvVar(key: string, defaultValue: string = ''): string {
    // Browser environment (Vite) - check for import.meta.env
    if (typeof window !== 'undefined') {
        try {
            // @ts-ignore - import.meta.env is available in browser with Vite
            const env = import.meta?.env;
            if (env && env[key] !== undefined) {
                return env[key];
            }
        } catch (e) {
            // Fallback if import.meta is not available
        }
    }

    // Node.js environment
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
        return process.env[key]!;
    }

    return defaultValue;
}

// API Configuration
export const API_CONFIG: ApiConfig = {
    baseUrl: getEnvVar('VITE_API_URL', 'https://localhost:7203'),
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
};

export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        PROFILE: '/api/auth/profile',
    },

    // Financial Data
    FINANCIAL: {
        STOCK_DATA: '/api/financial/stock-data',
        MARKET_DATA: '/api/financial/market-data',
        SYMBOLS: '/api/financial/symbols',
        HISTORICAL: '/api/financial/historical',
    },

    // Real-time updates
    WEBSOCKET: {
        HUB_URL: '/api/hubs/financial-data',
    },

    // File operations
    FILES: {
        UPLOAD: '/api/files/upload',
        DOWNLOAD: '/api/files/download',
        DELETE: '/api/files/delete',
    },
} as const;

// Application Configuration
export const APP_CONFIG: AppConfig = {
    api: API_CONFIG,
    features: {
        realTimeUpdates: true,
        darkMode: true,
        notifications: true,
    },
    chart: {
        defaultTimeframe: '1d',
        autoRefresh: true,
        refreshInterval: 30000, // 30 seconds
    },
};

// Chart Constants
export const CHART_CONFIG = {
    COLORS: {
        PRIMARY: '#3B82F6',
        SUCCESS: '#10B981',
        DANGER: '#EF4444',
        WARNING: '#F59E0B',
        INFO: '#6366F1',
        LIGHT: '#F8FAFC',
        DARK: '#1E293B',
        CANDLESTICK: {
            UP: '#10B981',
            DOWN: '#EF4444',
            NEUTRAL: '#6B7280',
        },
        EMA: {
            SHORT: '#3B82F6',
            MEDIUM: '#F59E0B',
            LONG: '#EF4444',
        },
    },

    DIMENSIONS: {
        DEFAULT_WIDTH: 800,
        DEFAULT_HEIGHT: 400,
        MIN_WIDTH: 300,
        MIN_HEIGHT: 200,
        MARGIN: {
            TOP: 20,
            RIGHT: 60,
            BOTTOM: 40,
            LEFT: 60,
        },
    },

    TIMEFRAMES: [
        { value: '1m', label: '1 Minute', duration: 60000 },
        { value: '5m', label: '5 Minutes', duration: 300000 },
        { value: '15m', label: '15 Minutes', duration: 900000 },
        { value: '1h', label: '1 Hour', duration: 3600000 },
        { value: '4h', label: '4 Hours', duration: 14400000 },
        { value: '1d', label: '1 Day', duration: 86400000 },
        { value: '1w', label: '1 Week', duration: 604800000 },
        { value: '1M', label: '1 Month', duration: 2628000000 },
    ] as const,

    DEFAULT_TIMEFRAME: '1d' as Timeframe,

    ANIMATION: {
        DURATION: 300,
        EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
} as const;

// File Upload Constants
export const FILE_CONFIG = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'text/csv',
        'application/json',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large file uploads
} as const;

// Validation Constants
export const VALIDATION = {
    EMAIL: {
        MIN_LENGTH: 5,
        MAX_LENGTH: 254,
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    STOCK_SYMBOL: {
        MIN_LENGTH: 1,
        MAX_LENGTH: 10,
        PATTERN: /^[A-Z0-9.-]+$/,
    },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK: {
        CONNECTION_FAILED: 'Unable to connect to the server. Please check your internet connection.',
        TIMEOUT: 'Request timed out. Please try again.',
        SERVER_ERROR: 'Server error occurred. Please try again later.',
        NOT_FOUND: 'The requested resource was not found.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        FORBIDDEN: 'Access denied.',
    },

    VALIDATION: {
        REQUIRED: 'This field is required.',
        INVALID_EMAIL: 'Please enter a valid email address.',
        INVALID_PASSWORD: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
        INVALID_SYMBOL: 'Please enter a valid stock symbol.',
        FILE_TOO_LARGE: `File size must be less than ${FILE_CONFIG.MAX_SIZE / (1024 * 1024)}MB.`,
        INVALID_FILE_TYPE: 'Invalid file type. Please select a valid file.',
    },

    FINANCIAL: {
        NO_DATA: 'No financial data available for this symbol.',
        INVALID_TIMEFRAME: 'Invalid timeframe selected.',
        CALCULATION_ERROR: 'Error occurred during calculation.',
    },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    AUTH: {
        LOGIN: 'Successfully logged in.',
        LOGOUT: 'Successfully logged out.',
        REGISTER: 'Account created successfully.',
    },

    FILE: {
        UPLOAD: 'File uploaded successfully.',
        DELETE: 'File deleted successfully.',
    },

    DATA: {
        SAVED: 'Data saved successfully.',
        UPDATED: 'Data updated successfully.',
        DELETED: 'Data deleted successfully.',
    },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
    CHART_SETTINGS: 'chart_settings',
    SELECTED_SYMBOLS: 'selected_symbols',
    RECENT_SEARCHES: 'recent_searches',
} as const;

// WebSocket Events
export const WS_EVENTS = {
    CONNECTION: {
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
        RECONNECT: 'reconnect',
        ERROR: 'error',
    },

    DATA: {
        MARKET_DATA_UPDATE: 'MarketDataUpdate',
        PRICE_ALERT: 'PriceAlert',
        SYSTEM_STATUS: 'SystemStatus',
    },
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
    FINANCIAL_DATA: 'financial-data',
    MARKET_DATA: 'market-data',
    SYMBOLS: 'symbols',
    USER_PROFILE: 'user-profile',
    HISTORICAL_DATA: 'historical-data',
} as const;

// Environment Configuration
export const ENV = {
    IS_DEVELOPMENT: getEnvVar('NODE_ENV') === 'development' || getEnvVar('DEV') === 'true',
    IS_PRODUCTION: getEnvVar('NODE_ENV') === 'production' || getEnvVar('PROD') === 'true',
    API_URL: getEnvVar('VITE_API_URL', 'https://localhost:7203'),
    WS_URL: getEnvVar('VITE_WS_URL', 'wss://localhost:7203'),
    APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
} as const;

// Export all constants
export const CONSTANTS = {
    API_CONFIG,
    API_ENDPOINTS,
    APP_CONFIG,
    CHART_CONFIG,
    FILE_CONFIG,
    VALIDATION,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    STORAGE_KEYS,
    WS_EVENTS,
    QUERY_KEYS,
    ENV,
} as const;

export default CONSTANTS;
