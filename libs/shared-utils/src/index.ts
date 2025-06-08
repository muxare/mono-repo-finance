// Date utilities
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
        case 'short':
            return d.toLocaleDateString();
        case 'long':
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'iso':
            return d.toISOString();
        default:
            return d.toLocaleDateString();
    }
};

export const parseDate = (dateString: string): Date => {
    return new Date(dateString);
};

export const isValidDate = (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.getTime());
};

// Number utilities
export const formatCurrency = (
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
};

export const formatPercentage = (
    value: number,
    decimals: number = 2
): string => {
    return `${(value * 100).toFixed(decimals)}%`;
};

export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

export const roundToDecimals = (value: number, decimals: number): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
};

// String utilities
export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const kebabCase = (str: string): string => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
};

export const camelCase = (str: string): string => {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
};

export const truncate = (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
};

// Array utilities
export const unique = <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
};

export const groupBy = <T, K extends keyof T>(
    array: T[],
    key: K
): Record<string, T[]> => {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        groups[groupKey] = groups[groupKey] || [];
        groups[groupKey].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

export const sortBy = <T>(
    array: T[],
    key: keyof T,
    direction: 'asc' | 'desc' = 'asc'
): T[] => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

export const chunk = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// Object utilities
export const pick = <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};

export const deepMerge = <T extends Record<string, any>>(
    target: T,
    ...sources: Partial<T>[]
): T => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                if (isObject(target[key])) {
                    deepMerge(target[key] as Record<string, any>, source[key] as Record<string, any>);
                }
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
};

const isObject = (item: any): item is Record<string, any> => {
    return item && typeof item === 'object' && !Array.isArray(item);
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await delay(delayMs);
            return retry(fn, retries - 1, delayMs);
        }
        throw error;
    }
};

export const timeout = <T>(
    promise: Promise<T>,
    ms: number
): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), ms)
        ),
    ]);
};

// Validation utilities
export const isEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

// Local storage utilities with error handling
export const storage = {
    get: <T>(key: string, defaultValue?: T): T | null => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue ?? null;
        } catch {
            return defaultValue ?? null;
        }
    },

    set: (key: string, value: any): boolean => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    remove: (key: string): boolean => {
        try {
            window.localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },

    clear: (): boolean => {
        try {
            window.localStorage.clear();
            return true;
        } catch {
            return false;
        }
    }
};

// Financial calculation utilities
export const calculatePercentageChange = (
    oldValue: number,
    newValue: number
): number => {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
};

export const calculateMovingAverage = (
    values: number[],
    period: number
): number[] => {
    const result: number[] = [];

    for (let i = period - 1; i < values.length; i++) {
        const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }

    return result;
};

export const calculateVolatility = (prices: number[]): number => {
    if (prices.length < 2) return 0;

    const returns = prices.slice(1).map((price, i) => {
        const prevPrice = prices[i];
        return prevPrice ? Math.log(price / prevPrice) : 0;
    });

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    return Math.sqrt(variance * 252); // Annualized volatility
};
