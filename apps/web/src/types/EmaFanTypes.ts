/**
 * Types for EMA Fan analysis
 */

export interface EmaFanData {
  id: number;
  symbol: string;
  name: string;
  sectorName: string;
  latestPrice: number | null;
  ema18: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  emaFanScore: number;
  isPerfectEmaFan: boolean;
  fanStrength: number | null;
}

export interface EmaFanSummary {
  totalStocksAnalyzed: number;
  perfectEmaFanCount: number;
  averageEmaFanScore: number;
  sectorBreakdown: SectorEmaFanStats[];
  lastUpdated: string;
}

export interface SectorEmaFanStats {
  sectorName: string;
  totalStocks: number;
  perfectEmaFanCount: number;
  averageScore: number;
  percentPerfect: number;
}

export type EmaFanSortField = 'emaFanScore' | 'fanStrength' | 'symbol' | 'name' | 'sectorName' | 'latestPrice';
export type SortDirection = 'asc' | 'desc';

export interface EmaFanListProps {
  limit?: number;
  showSummary?: boolean;
  enableSearch?: boolean;
  enableSorting?: boolean;
  onCompanySelect?: (company: EmaFanData) => void;
  className?: string;
}
