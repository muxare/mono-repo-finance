using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Service for managing background calculation jobs and caching
/// </summary>
public interface ICalculationJobService
{
    /// <summary>
    /// Enqueue background calculation for a specific stock
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <returns>Job ID</returns>
    Task<string> EnqueueStockCalculationAsync(int stockId);
    
    /// <summary>
    /// Enqueue background calculations for all active stocks
    /// </summary>
    /// <returns>Job ID</returns>
    Task<string> EnqueueAllStocksCalculationAsync();
    
    /// <summary>
    /// Schedule recurring calculation jobs
    /// </summary>
    Task ScheduleRecurringCalculationsAsync();
    
    /// <summary>
    /// Get cached calculations for a stock
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Cached calculations or null if not cached</returns>
    Task<StockCalculationsDto?> GetCachedCalculationsAsync(int stockId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Cache calculations for a stock
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="calculations">Calculations to cache</param>
    /// <param name="expiration">Cache expiration time</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task CacheCalculationsAsync(int stockId, StockCalculationsDto calculations, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Invalidate cache for a specific stock
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task InvalidateCacheAsync(int stockId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Invalidate all calculation caches
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    Task InvalidateAllCachesAsync(CancellationToken cancellationToken = default);
}
