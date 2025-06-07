using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Interface for price calculation services
/// </summary>
public interface IPriceCalculationService
{
    /// <summary>
    /// Calculate basic price metrics for a stock
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Calculated price metrics</returns>
    Task<CalculatedMetricsDto> CalculatePriceMetricsAsync(int stockId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate price metrics for multiple stocks
    /// </summary>
    /// <param name="stockIds">Collection of stock identifiers</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Dictionary of stock ID to calculated metrics</returns>
    Task<Dictionary<int, CalculatedMetricsDto>> CalculatePriceMetricsBatchAsync(IEnumerable<int> stockIds, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate Volume Weighted Average Price for a specific date range
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="startDate">Start date for calculation</param>
    /// <param name="endDate">End date for calculation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>VWAP value</returns>
    Task<decimal> CalculateVWAPAsync(int stockId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate daily returns for a stock over a specified period
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="days">Number of days to look back</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of daily returns</returns>
    Task<List<decimal>> CalculateDailyReturnsAsync(int stockId, int days, CancellationToken cancellationToken = default);
}
