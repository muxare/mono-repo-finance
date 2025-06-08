using Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

/// <summary>
/// Service for market-wide analysis operations
/// </summary>
public class MarketAnalysisService : IMarketAnalysisService
{
    private readonly IStockService _stockService;
    private readonly ITechnicalIndicatorService _technicalIndicatorService;
    private readonly ILogger<MarketAnalysisService> _logger;

    public MarketAnalysisService(
        IStockService stockService,
        ITechnicalIndicatorService technicalIndicatorService,
        ILogger<MarketAnalysisService> logger)
    {
        _stockService = stockService;
        _technicalIndicatorService = technicalIndicatorService;
        _logger = logger;
    }

    /// <summary>
    /// Gets stocks ranked by EMA Fan condition (ema18 > ema50 > ema100 > ema200)
    /// </summary>
    public async Task<List<EmaFanDto>> GetEmaFanRankingAsync(int limit = 100, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting EMA Fan ranking calculation for up to {Limit} stocks", limit);            // Get all active stocks (we'll process them in batches to avoid memory issues)
            var stockQuery = new StockQueryParameters 
            { 
                PageSize = 1000, // Process in batches of 1000
                Page = 1,
                IsActive = true
            };

            var emaFanResults = new List<EmaFanDto>();
            bool hasMoreStocks = true;

            while (hasMoreStocks && cancellationToken.IsCancellationRequested == false)
            {                var stocksPage = await _stockService.GetStocksAsync(stockQuery);
                
                if (stocksPage.Data.Count() == 0)
                {
                    hasMoreStocks = false;
                    continue;
                }

                _logger.LogDebug("Processing batch {PageNumber} with {Count} stocks", 
                    stockQuery.Page, stocksPage.Data.Count());

                // Process each stock in the current batch
                var batchTasks = stocksPage.Data.Select(async stock =>
                {
                    try
                    {
                        return await CalculateEmaFanForStock(stock, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to calculate EMA Fan for stock {Symbol}", stock.Symbol);
                        return null;
                    }
                });

                var batchResults = await Task.WhenAll(batchTasks);
                emaFanResults.AddRange(batchResults.Where(r => r != null).Cast<EmaFanDto>());                // Check if we have more pages
                hasMoreStocks = stockQuery.Page < stocksPage.TotalPages;
                stockQuery.Page++;
            }

            // Sort by EMA Fan score (descending), then by fan strength (descending)
            var sortedResults = emaFanResults
                .OrderByDescending(x => x.EmaFanScore)
                .ThenByDescending(x => x.FanStrength ?? 0)
                .ThenBy(x => x.Symbol)
                .Take(limit)
                .ToList();

            _logger.LogInformation("EMA Fan ranking completed. Processed {TotalStocks} stocks, returning top {ResultCount}", 
                emaFanResults.Count, sortedResults.Count);

            return sortedResults;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating EMA Fan ranking");
            throw;
        }
    }

    /// <summary>
    /// Calculates EMA Fan score for a single stock
    /// </summary>
    private async Task<EmaFanDto?> CalculateEmaFanForStock(StockSummaryDto stock, CancellationToken cancellationToken)
    {        try
        {
            // Calculate EMAs for all required periods in one call
            var emaResults = await _technicalIndicatorService.CalculateEMAAsync(
                stock.Id, 
                new int[] { 18, 50, 100, 200 }, 
                cancellationToken);

            // Extract the EMA values for each period
            var latestEma18 = emaResults.TryGetValue(18, out var ema18) ? ema18 : (decimal?)null;
            var latestEma50 = emaResults.TryGetValue(50, out var ema50) ? ema50 : (decimal?)null;
            var latestEma100 = emaResults.TryGetValue(100, out var ema100) ? ema100 : (decimal?)null;
            var latestEma200 = emaResults.TryGetValue(200, out var ema200) ? ema200 : (decimal?)null;

            // Calculate EMA Fan score
            var (score, isPerfectFan, fanStrength) = CalculateEmaFanScore(
                latestEma18, latestEma50, latestEma100, latestEma200);

            return new EmaFanDto
            {
                Id = stock.Id,
                Symbol = stock.Symbol,
                Name = stock.Name,
                SectorName = stock.SectorName,
                LatestPrice = stock.LatestPrice,
                Ema18 = latestEma18,
                Ema50 = latestEma50,
                Ema100 = latestEma100,
                Ema200 = latestEma200,
                EmaFanScore = score,
                IsPerfectEmaFan = isPerfectFan,
                FanStrength = fanStrength
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to calculate EMA Fan for stock {Symbol}", stock.Symbol);
            return null;
        }
    }

    /// <summary>
    /// Calculates the EMA Fan score based on the condition: ema18 > ema50 > ema100 > ema200
    /// </summary>
    private static (int score, bool isPerfectFan, decimal? fanStrength) CalculateEmaFanScore(
        decimal? ema18, decimal? ema50, decimal? ema100, decimal? ema200)
    {
        // If any EMA is missing, return score 0
        if (!ema18.HasValue || !ema50.HasValue || !ema100.HasValue || !ema200.HasValue)
        {
            return (0, false, null);
        }

        var score = 0;
        
        // Check each condition sequentially
        if (ema18 > ema50) score++;
        if (ema50 > ema100 && score >= 1) score++;
        if (ema100 > ema200 && score >= 2) score++;

        var isPerfectFan = score == 3;
        
        // Calculate fan strength for perfect fans
        decimal? fanStrength = null;
        if (isPerfectFan)
        {
            // Calculate the relative spacing between EMAs as a measure of fan strength
            // Higher values indicate better separation between EMAs
            var spacing1 = (ema18.Value - ema50.Value) / ema50.Value * 100;
            var spacing2 = (ema50.Value - ema100.Value) / ema100.Value * 100;
            var spacing3 = (ema100.Value - ema200.Value) / ema200.Value * 100;
            
            fanStrength = (spacing1 + spacing2 + spacing3) / 3; // Average spacing
        }

        return (score, isPerfectFan, fanStrength);
    }
}
