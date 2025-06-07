/**
 * Chart Component Exports
 * Story 2.1.3: D3.js Candlestick Chart Component
 */

export { default as CandlestickChart } from './CandlestickChart';
export type { CandlestickChartProps } from './CandlestickChart';

// Re-export related hooks for convenience
export { useCandlestickChart } from '../../hooks/useCandlestickChart';
export { useChartDimensions } from '../../hooks/useChartDimensions';

// Re-export chart-related types
export type {
  OHLCV,
  IndicatorConfig,
  Timeframe,
  ChartConfiguration,
  ChartTheme,
} from '../../types/ApiTypes';
