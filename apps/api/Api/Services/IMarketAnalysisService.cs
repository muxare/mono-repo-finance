using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Service interface for market-wide analysis operations
/// </summary>
public interface IMarketAnalysisService
{
    /// <summary>
    /// Gets stocks ranked by EMA Fan condition (ema18 > ema50 > ema100 > ema200)
    /// </summary>
    /// <param name="limit">Maximum number of results to return (default: 100)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of stocks ordered by EMA Fan score (highest first)</returns>
    Task<List<EmaFanDto>> GetEmaFanRankingAsync(int limit = 100, CancellationToken cancellationToken = default);
}
