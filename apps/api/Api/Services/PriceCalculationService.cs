using Api.Data;
using Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

/// <summary>
/// Service for calculating basic price metrics
/// </summary>
public class PriceCalculationService : IPriceCalculationService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<PriceCalculationService> _logger;

    public PriceCalculationService(FinanceDbContext context, ILogger<PriceCalculationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CalculatedMetricsDto> CalculatePriceMetricsAsync(int stockId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Get the latest price data
            var latestPrices = await _context.StockPrices
                .Where(p => p.StockId == stockId)
                .OrderByDescending(p => p.Date)
                .Take(2)
                .ToListAsync(cancellationToken);

            if (!latestPrices.Any())
            {
                _logger.LogWarning("No price data found for stock ID {StockId}", stockId);
                return new CalculatedMetricsDto { CalculatedAt = DateTime.UtcNow };
            }

            var currentPrice = latestPrices[0];
            var previousPrice = latestPrices.Count > 1 ? latestPrices[1] : null;

            var metrics = new CalculatedMetricsDto
            {
                DayHigh = currentPrice.High,
                DayLow = currentPrice.Low,
                CalculatedAt = DateTime.UtcNow
            };

            // Calculate price change and percentage change
            if (previousPrice != null)
            {
                metrics.PriceChange = currentPrice.Close - previousPrice.Close;
                metrics.ChangePercent = previousPrice.Close != 0 
                    ? (metrics.PriceChange / previousPrice.Close) * 100 
                    : 0;
                
                // Calculate gap percentage (open vs previous close)
                metrics.GapPercent = previousPrice.Close != 0
                    ? ((currentPrice.Open - previousPrice.Close) / previousPrice.Close) * 100
                    : 0;
            }

            // Calculate VWAP for the current day
            metrics.VWAP = await CalculateVWAPAsync(stockId, currentPrice.Date, currentPrice.Date, cancellationToken);

            // Calculate 30-day volatility
            var thirtyDaysAgo = currentPrice.Date.AddDays(-30);
            var volatilityPrices = await _context.StockPrices
                .Where(p => p.StockId == stockId && p.Date >= thirtyDaysAgo && p.Date <= currentPrice.Date)
                .OrderBy(p => p.Date)
                .Select(p => p.Close)
                .ToListAsync(cancellationToken);

            if (volatilityPrices.Count >= 2)
            {
                metrics.Volatility = CalculateVolatility(volatilityPrices);
            }

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating price metrics for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<Dictionary<int, CalculatedMetricsDto>> CalculatePriceMetricsBatchAsync(IEnumerable<int> stockIds, CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<int, CalculatedMetricsDto>();
        
        foreach (var stockId in stockIds)
        {
            try
            {
                result[stockId] = await CalculatePriceMetricsAsync(stockId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating price metrics for stock ID {StockId} in batch", stockId);
                result[stockId] = new CalculatedMetricsDto { CalculatedAt = DateTime.UtcNow };
            }
        }

        return result;
    }

    public async Task<decimal> CalculateVWAPAsync(int stockId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        try
        {
            var prices = await _context.StockPrices
                .Where(p => p.StockId == stockId && p.Date >= startDate && p.Date <= endDate)
                .Select(p => new { 
                    TypicalPrice = (p.High + p.Low + p.Close) / 3,
                    Volume = p.Volume
                })
                .ToListAsync(cancellationToken);

            if (!prices.Any())
                return 0;

            var totalVolumePrice = prices.Sum(p => p.TypicalPrice * p.Volume);
            var totalVolume = prices.Sum(p => p.Volume);

            return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating VWAP for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<List<decimal>> CalculateDailyReturnsAsync(int stockId, int days, CancellationToken cancellationToken = default)
    {
        try
        {
            var prices = await _context.StockPrices
                .Where(p => p.StockId == stockId)
                .OrderByDescending(p => p.Date)
                .Take(days + 1)
                .OrderBy(p => p.Date)
                .Select(p => p.Close)
                .ToListAsync(cancellationToken);

            var returns = new List<decimal>();
            
            for (int i = 1; i < prices.Count; i++)
            {
                if (prices[i - 1] != 0)
                {
                    var dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
                    returns.Add(dailyReturn);
                }
            }

            return returns;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating daily returns for stock ID {StockId}", stockId);
            throw;
        }
    }

    /// <summary>
    /// Calculate volatility from price series
    /// </summary>
    /// <param name="prices">Price series</param>
    /// <returns>Volatility as decimal</returns>
    private static decimal CalculateVolatility(List<decimal> prices)
    {
        if (prices.Count < 2)
            return 0;

        // Calculate daily returns
        var returns = new List<decimal>();
        for (int i = 1; i < prices.Count; i++)
        {
            if (prices[i - 1] != 0)
            {
                returns.Add((prices[i] - prices[i - 1]) / prices[i - 1]);
            }
        }

        if (!returns.Any())
            return 0;

        // Calculate standard deviation of returns
        var mean = returns.Average();
        var variance = returns.Sum(r => (r - mean) * (r - mean)) / returns.Count;
        
        return (decimal)Math.Sqrt((double)variance) * (decimal)Math.Sqrt(252); // Annualized
    }
}
