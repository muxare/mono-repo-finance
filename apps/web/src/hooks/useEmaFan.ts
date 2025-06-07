import { useState, useEffect, useCallback } from 'react';
import { EmaFanService } from '../services/api/emaFanService';
import type { EmaFanData, EmaFanSummary } from '../types/EmaFanTypes';

const emaFanService = new EmaFanService();

export interface UseEmaFanOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseEmaFanResult {
  data: EmaFanData[];
  summary: EmaFanSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

export const useEmaFan = (options: UseEmaFanOptions = {}): UseEmaFanResult => {
  const {
    limit = 100,
    autoRefresh = false,
    refreshInterval = 60000 // 1 minute
  } = options;

  const [data, setData] = useState<EmaFanData[]>([]);
  const [summary, setSummary] = useState<EmaFanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [fanData, summaryData] = await Promise.all([
        emaFanService.getEmaFanRanking(limit),
        emaFanService.getEmaFanSummary()
      ]);

      setData(fanData);
      setSummary(summaryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load EMA Fan data';
      setError(errorMessage);
      console.error('useEmaFan error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const clearCache = useCallback(() => {
    emaFanService.clearCache();
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    data,
    summary,
    loading,
    error,
    refresh,
    clearCache
  };
};
