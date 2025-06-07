/**
 * Service for EMA Fan analysis endpoints
 */

import { ApiClient } from './ApiClient';
import { DEFAULT_API_CONFIG } from './config';
import type { EmaFanData, EmaFanSummary } from '../../types/EmaFanTypes';

export class EmaFanService {
  private apiClient: ApiClient;
  constructor(apiClient?: ApiClient) {    this.apiClient = apiClient || new ApiClient({
      ...DEFAULT_API_CONFIG,
      baseURL: DEFAULT_API_CONFIG.baseURL + '/api',
    });
  }
  /**
   * Get companies ranked by EMA Fan technical indicator
   */
  async getEmaFanRanking(limit: number = 100): Promise<EmaFanData[]> {
    try {
      const response = await this.apiClient.get<EmaFanData[]>(
        '/market/analysis/ema-fan',
        {
          params: { limit },
          cache: { 
            key: `ema-fan-ranking-${limit}`,
            ttl: 2 * 60 * 1000, // 2 minutes cache for real-time data
          }
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to fetch EMA Fan ranking:', error);
      throw new Error('Unable to load EMA Fan analysis data');
    }
  }

  /**
   * Get EMA Fan summary statistics
   */
  async getEmaFanSummary(): Promise<EmaFanSummary> {
    try {
      const response = await this.apiClient.get<EmaFanSummary>(
        '/market/analysis/ema-fan/summary',
        {
          cache: { 
            key: 'ema-fan-summary',
            ttl: 5 * 60 * 1000, // 5 minutes cache
          }
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to fetch EMA Fan summary:', error);
      throw new Error('Unable to load EMA Fan summary data');
    }
  }

  /**
   * Clear EMA Fan related cache
   */
  clearCache(): void {
    // Note: Implement cache clearing based on ApiClient interface
    console.log('Cache clearing not implemented yet');
  }
}
