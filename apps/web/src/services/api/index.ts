/**
 * API Services Index
 * Main exports for API client and services
 */

import { ApiClient } from './ApiClient';
import { FinancialDataService } from './FinancialDataService';
import { DEFAULT_API_CONFIG } from './config';

// Create singleton instances
const apiClient = new ApiClient(DEFAULT_API_CONFIG);
const financialDataService = new FinancialDataService(apiClient);

// Export service instances
export { apiClient, financialDataService };

// Export service factories for testing or multiple instances
export const createApiClient = (config = DEFAULT_API_CONFIG) => new ApiClient(config);
export const createFinancialDataService = (client = apiClient) => new FinancialDataService(client);

// Convenience getters
export const getApiClient = () => apiClient;
export const getFinancialDataService = () => financialDataService;
export const getApiService = () => financialDataService; // Alias for backward compatibility

// Export classes and types
export { ApiClient, FinancialDataService };
export { DEFAULT_API_CONFIG, API_ENDPOINTS, CACHE_TTL } from './config';
export * from './transformers';
export type { ApiClientConfig } from '../../types/ApiTypes';
