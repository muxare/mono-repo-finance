/**
 * API Services Index
 * Main exports for API client and services
 */

import { ApiClient } from './ApiClient';
import { FinancialDataService } from './FinancialDataService';
import { EmaFanService } from './emaFanService';
import { DEFAULT_API_CONFIG } from './config';

// Create singleton instances
const apiClient = new ApiClient(DEFAULT_API_CONFIG);
const financialDataService = new FinancialDataService(apiClient);
const emaFanService = new EmaFanService(apiClient);

// Export service instances
export { apiClient, financialDataService, emaFanService };

// Export service factories for testing or multiple instances
export const createApiClient = (config = DEFAULT_API_CONFIG) => new ApiClient(config);
export const createFinancialDataService = (client = apiClient) => new FinancialDataService(client);
export const createEmaFanService = (client = apiClient) => new EmaFanService(client);

// Convenience getters
export const getApiClient = () => apiClient;
export const getFinancialDataService = () => financialDataService;
export const getEmaFanService = () => emaFanService;
export const getApiService = () => financialDataService; // Alias for backward compatibility

// Export classes and types
export { ApiClient, FinancialDataService, EmaFanService };
export { DEFAULT_API_CONFIG, API_ENDPOINTS, CACHE_TTL } from './config';
export * from './transformers';
export type { ApiClientConfig } from '../../types/ApiTypes';
