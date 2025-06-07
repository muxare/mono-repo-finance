import type { ScaleLinear, ScaleTime } from 'd3';

// Chart dimension and configuration types
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

export interface ChartBounds {
  chartWidth: number;
  chartHeight: number;
}

// Chart data types
export interface OHLCV {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorData {
  time: number;
  value: number;
}

export interface IndicatorConfig {
  type: IndicatorType;
  visible: boolean;
  color?: string;
  data?: IndicatorData[];
  parameters?: Record<string, any>;
}

export type IndicatorType = 
  | 'SMA' 
  | 'EMA' 
  | 'RSI' 
  | 'MACD' 
  | 'BOLLINGER_BANDS'
  | 'VOLUME'
  | 'SUPPORT_RESISTANCE';

export type Timeframe = 
  | '1D' 
  | '1W' 
  | '1M' 
  | '3M' 
  | '6M' 
  | '1Y' 
  | 'ALL';

export type ChartTheme = 'light' | 'dark';

// D3 scales types
export interface ChartScales {
  xScale: ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;
  volumeScale: ScaleLinear<number, number>;
  chartWidth: number;
  chartHeight: number;
}

// Chart configuration
export interface D3ChartConfig {
  data: OHLCV[];
  dimensions: ChartDimensions;
  timeframe: Timeframe;
  showVolume: boolean;
  indicators: IndicatorConfig[];
  theme: ChartTheme;
}

// Chart interaction types
export interface ChartInteractions {
  fitToData: () => void;
  zoomToTimeRange: (startTime: Date, endTime: Date) => void;
  resetZoom: () => void;
}

// Mouse/touch interaction data
export interface CrosshairData {
  x: number;
  y: number;
  time: Date;
  price: number;
  data?: OHLCV;
}

// Chart event types
export interface ChartEvents {
  onCrosshairMove?: (data: CrosshairData | null) => void;
  onZoom?: (transform: { x: number; y: number; k: number }) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

// Price formatting utilities
export interface PriceFormatter {
  formatPrice: (price: number) => string;
  formatVolume: (volume: number) => string;
  formatPercent: (percent: number) => string;
}

// Chart color scheme
export interface ChartColors {
  bullish: string;
  bearish: string;
  volume: {
    bullish: string;
    bearish: string;
  };
  indicators: {
    sma: string;
    ema: string;
    rsi: string;
    macd: string;
    bollingerBands: string;
  };
  grid: string;
  text: string;
  background: string;
  crosshair: string;
}

// Chart performance options
export interface PerformanceOptions {
  maxDataPoints: number;
  enableTransitions: boolean;
  debounceResize: number;
  throttleZoom: number;
}

// Default configurations
export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 500,
  margin: {
    top: 20,
    right: 60,
    bottom: 40,
    left: 60,
  },
};

export const DEFAULT_TIMEFRAME: Timeframe = '1M';

export const LIGHT_THEME_COLORS: ChartColors = {
  bullish: '#4CAF50',
  bearish: '#F44336',
  volume: {
    bullish: 'rgba(76, 175, 80, 0.3)',
    bearish: 'rgba(244, 67, 54, 0.3)',
  },
  indicators: {
    sma: '#2196F3',
    ema: '#FF9800',
    rsi: '#9C27B0',
    macd: '#607D8B',
    bollingerBands: '#795548',
  },
  grid: '#E0E0E0',
  text: '#333333',
  background: '#FFFFFF',
  crosshair: '#666666',
};

export const DARK_THEME_COLORS: ChartColors = {
  bullish: '#4CAF50',
  bearish: '#F44336',
  volume: {
    bullish: 'rgba(76, 175, 80, 0.3)',
    bearish: 'rgba(244, 67, 54, 0.3)',
  },
  indicators: {
    sma: '#2196F3',
    ema: '#FF9800',
    rsi: '#9C27B0',
    macd: '#607D8B',
    bollingerBands: '#795548',
  },
  grid: '#424242',
  text: '#FFFFFF',
  background: '#1E1E1E',
  crosshair: '#CCCCCC',
};

export const DEFAULT_PERFORMANCE_OPTIONS: PerformanceOptions = {
  maxDataPoints: 1000,
  enableTransitions: true,
  debounceResize: 250,
  throttleZoom: 16, // ~60fps
};

// Utility type for chart component props
export interface BaseCandlestickChartProps {
  symbol: string;
  timeframe?: Timeframe;
  height?: number;
  showVolume?: boolean;
  indicators?: IndicatorConfig[];
  theme?: ChartTheme;
  className?: string;
  performanceOptions?: Partial<PerformanceOptions>;
}
