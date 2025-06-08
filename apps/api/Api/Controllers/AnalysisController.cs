using Api.Models.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Controller for market-wide analysis and rankings
/// </summary>
[ApiController]
[Route("api/market/[controller]")]
[Produces("application/json")]
public class AnalysisController : ControllerBase
{
    private readonly IMarketAnalysisService _marketAnalysisService;
    private readonly ILogger<AnalysisController> _logger;

    public AnalysisController(
        IMarketAnalysisService marketAnalysisService,
        ILogger<AnalysisController> logger)
    {
        _marketAnalysisService = marketAnalysisService;
        _logger = logger;
    }

    /// <summary>
    /// Get stocks ranked by EMA Fan technical indicator
    /// </summary>
    /// <param name="limit">Maximum number of results to return (default: 100, max: 500)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of stocks ordered by EMA Fan score (ema18 > ema50 > ema100 > ema200)</returns>
    /// <remarks>
    /// The EMA Fan indicator ranks stocks based on how well they satisfy the condition:
    /// EMA(18) > EMA(50) > EMA(100) > EMA(200)
    /// 
    /// EMA Fan Score:
    /// - 3: Perfect fan (all conditions satisfied)
    /// - 2: Two consecutive conditions satisfied  
    /// - 1: One condition satisfied
    /// - 0: No conditions satisfied
    /// 
    /// Results are ordered by EMA Fan Score (descending), then by Fan Strength (descending).
    /// </remarks>
    [HttpGet("ema-fan")]
    [ProducesResponseType(typeof(List<EmaFanDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<List<EmaFanDto>>> GetEmaFanRanking(
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate input parameters
            if (limit <= 0 || limit > 500)
            {
                return BadRequest($"Limit must be between 1 and 500. Provided: {limit}");
            }

            _logger.LogInformation("Getting EMA Fan ranking with limit {Limit}", limit);

            var results = await _marketAnalysisService.GetEmaFanRankingAsync(limit, cancellationToken);

            _logger.LogInformation("Successfully retrieved {Count} EMA Fan results", results.Count);

            return Ok(results);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("EMA Fan ranking request was cancelled");
            return StatusCode(499, "Request was cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving EMA Fan ranking");
            return StatusCode(500, "An error occurred while calculating EMA Fan rankings");
        }
    }

    /// <summary>
    /// Get summary statistics for EMA Fan analysis across the market
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Summary statistics for EMA Fan conditions</returns>
    [HttpGet("ema-fan/summary")]
    [ProducesResponseType(typeof(EmaFanSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmaFanSummaryDto>> GetEmaFanSummary(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Getting EMA Fan summary statistics");

            // Get all EMA Fan results to calculate summary statistics
            var allResults = await _marketAnalysisService.GetEmaFanRankingAsync(int.MaxValue, cancellationToken);

            var summary = new EmaFanSummaryDto
            {
                TotalStocksAnalyzed = allResults.Count,
                PerfectEmaFanCount = allResults.Count(x => x.IsPerfectEmaFan),
                ScoreDistribution = allResults
                    .GroupBy(x => x.EmaFanScore)
                    .ToDictionary(g => g.Key, g => g.Count()),
                AverageFanStrength = allResults
                    .Where(x => x.FanStrength.HasValue)
                    .Select(x => x.FanStrength!.Value)
                    .DefaultIfEmpty(0)
                    .Average(),
                TopSectors = allResults
                    .Where(x => x.IsPerfectEmaFan)
                    .GroupBy(x => x.SectorName)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .ToDictionary(g => g.Key, g => g.Count())
            };

            _logger.LogInformation("Successfully calculated EMA Fan summary statistics");

            return Ok(summary);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("EMA Fan summary request was cancelled");
            return StatusCode(499, "Request was cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating EMA Fan summary");
            return StatusCode(500, "An error occurred while calculating EMA Fan summary");
        }
    }
}
