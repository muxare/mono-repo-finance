using Api.Data;
using Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Services;

/// <summary>
/// Service for statistical analysis and calculations
/// </summary>
public class StatisticalAnalysisService : IStatisticalAnalysisService
{
    private readonly FinanceDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<StatisticalAnalysisService> _logger;

    public StatisticalAnalysisService(
        FinanceDbContext context, 
        IMemoryCache cache,
        ILogger<StatisticalAnalysisService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<StatisticalAnalysisDto> CalculateStatisticsAsync(int stockId, CancellationToken cancellationToken = default)
    {
        try
        {
            var statistics = new StatisticalAnalysisDto();

            // Calculate all statistics in parallel
            var volatilityTask = CalculateVolatilityAsync(stockId, 252, cancellationToken);
            var betaTask = CalculateBetaAsync(stockId, "SPY", 252, cancellationToken);
            var correlationTask = CalculateCorrelationAsync(stockId, 1, 252, cancellationToken);
            var sharpeTask = CalculateSharpeRatioAsync(stockId, 0.02m, 252, cancellationToken);
            var varTask = CalculateVaRAsync(stockId, 252, cancellationToken);
            var maxDrawdownTask = CalculateMaxDrawdownAsync(stockId, 252, cancellationToken);
            var performanceTask = CalculatePerformanceMetricsAsync(stockId, cancellationToken);

            await Task.WhenAll(volatilityTask, betaTask, correlationTask, sharpeTask, varTask, maxDrawdownTask, performanceTask);

            statistics.Volatility = await volatilityTask;
            statistics.Beta = await betaTask;
            statistics.Correlation = await correlationTask;
            statistics.SharpeRatio = await sharpeTask;
            statistics.VaR95 = await varTask;
            statistics.MaxDrawdown = await maxDrawdownTask;
            statistics.Performance = await performanceTask;

            statistics.CalculatedAt = DateTime.UtcNow;

            _logger.LogInformation("Calculated statistics for stock ID {StockId}", stockId);
            return statistics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating statistics for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<decimal> CalculateVolatilityAsync(int stockId, int days = 252, CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = $"volatility_{stockId}_{days}";
            if (_cache.TryGetValue(cacheKey, out decimal cachedVolatility))
                return cachedVolatility;

            var endDate = DateTime.UtcNow.Date;
            var startDate = endDate.AddDays(-days);

            var prices = await _context.StockPrices
                .Where(sp => sp.StockId == stockId && sp.Date >= startDate && sp.Date <= endDate)
                .OrderBy(sp => sp.Date)
                .Select(sp => sp.Close)
                .ToListAsync(cancellationToken);

            if (prices.Count < 2)
                return 0;

            var returns = new List<decimal>();
            for (int i = 1; i < prices.Count; i++)
            {
                var dailyReturn = Math.Log((double)(prices[i] / prices[i - 1]));
                returns.Add((decimal)dailyReturn);
            }

            var mean = returns.Average();
            var variance = returns.Select(r => (r - mean) * (r - mean)).Average();
            var volatility = (decimal)Math.Sqrt((double)variance) * (decimal)Math.Sqrt(252); // Annualized

            _cache.Set(cacheKey, volatility, TimeSpan.FromHours(1));
            return volatility;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating volatility for stock ID {StockId}", stockId);
            return 0;
        }
    }    public Task<decimal> CalculateBetaAsync(int stockId, string marketSymbol = "SPY", int days = 252, CancellationToken cancellationToken = default)
    {
        try
        {
            // For now, return a placeholder value since we need market data for proper beta calculation
            // In a real implementation, you would:
            // 1. Get market index data (SPY)
            // 2. Calculate returns for both stock and market
            // 3. Calculate covariance and market variance
            // 4. Beta = Covariance(stock, market) / Variance(market)
            
            _logger.LogWarning("Beta calculation not fully implemented - returning placeholder value for stock ID {StockId}", stockId);
            return Task.FromResult(1.0m); // Market beta placeholder
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating beta for stock ID {StockId}", stockId);
            return Task.FromResult(1.0m);
        }
    }    public Task<decimal> CalculateCorrelationAsync(int stockId1, int stockId2, int days = 252, CancellationToken cancellationToken = default)
    {
        try
        {
            // For now, return a placeholder value since we need to implement proper correlation calculation
            // In a real implementation, you would:
            // 1. Get price data for both stocks
            // 2. Calculate returns for both
            // 3. Calculate correlation coefficient
            
            _logger.LogWarning("Correlation calculation not fully implemented - returning placeholder value for stocks {StockId1} and {StockId2}", stockId1, stockId2);
            return Task.FromResult(0.0m); // No correlation placeholder
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating correlation for stocks {StockId1} and {StockId2}", stockId1, stockId2);
            return Task.FromResult(0.0m);
        }
    }

    public async Task<decimal> CalculateSharpeRatioAsync(int stockId, decimal riskFreeRate = 0.02m, int days = 252, CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = $"sharpe_{stockId}_{riskFreeRate}_{days}";
            if (_cache.TryGetValue(cacheKey, out decimal cachedSharpe))
                return cachedSharpe;

            var endDate = DateTime.UtcNow.Date;
            var startDate = endDate.AddDays(-days);

            var prices = await _context.StockPrices
                .Where(sp => sp.StockId == stockId && sp.Date >= startDate && sp.Date <= endDate)
                .OrderBy(sp => sp.Date)
                .Select(sp => sp.Close)
                .ToListAsync(cancellationToken);

            if (prices.Count < 2)
                return 0;

            var returns = new List<decimal>();
            for (int i = 1; i < prices.Count; i++)
            {
                var dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
                returns.Add(dailyReturn);
            }

            var averageReturn = returns.Average() * 252; // Annualized
            var volatility = await CalculateVolatilityAsync(stockId, days, cancellationToken);
            
            var sharpeRatio = volatility > 0 ? (averageReturn - riskFreeRate) / volatility : 0;

            _cache.Set(cacheKey, sharpeRatio, TimeSpan.FromHours(1));
            return sharpeRatio;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating Sharpe ratio for stock ID {StockId}", stockId);
            return 0;
        }
    }

    public async Task<decimal> CalculateVaRAsync(int stockId, int days = 252, CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = $"var_{stockId}_{days}";
            if (_cache.TryGetValue(cacheKey, out decimal cachedVaR))
                return cachedVaR;

            var endDate = DateTime.UtcNow.Date;
            var startDate = endDate.AddDays(-days);

            var prices = await _context.StockPrices
                .Where(sp => sp.StockId == stockId && sp.Date >= startDate && sp.Date <= endDate)
                .OrderBy(sp => sp.Date)
                .Select(sp => sp.Close)
                .ToListAsync(cancellationToken);

            if (prices.Count < 2)
                return 0;

            var returns = new List<decimal>();
            for (int i = 1; i < prices.Count; i++)
            {
                var dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
                returns.Add(dailyReturn);
            }

            // Calculate 95% VaR (5th percentile of returns)
            var sortedReturns = returns.OrderBy(r => r).ToList();
            var confidenceLevel = 0.95m;
            var index = (int)Math.Floor((1 - confidenceLevel) * sortedReturns.Count);
            var var95 = Math.Abs(sortedReturns[index]) * 100; // Convert to percentage

            _cache.Set(cacheKey, var95, TimeSpan.FromHours(1));
            return var95;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating VaR for stock ID {StockId}", stockId);
            return 0;
        }
    }

    public async Task<decimal> CalculateMaxDrawdownAsync(int stockId, int days = 252, CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = $"maxdrawdown_{stockId}_{days}";
            if (_cache.TryGetValue(cacheKey, out decimal cachedDrawdown))
                return cachedDrawdown;

            var endDate = DateTime.UtcNow.Date;
            var startDate = endDate.AddDays(-days);

            var prices = await _context.StockPrices
                .Where(sp => sp.StockId == stockId && sp.Date >= startDate && sp.Date <= endDate)
                .OrderBy(sp => sp.Date)
                .Select(sp => sp.Close)
                .ToListAsync(cancellationToken);

            if (prices.Count < 2)
                return 0;

            decimal maxDrawdown = 0;
            decimal peak = prices[0];

            foreach (var price in prices)
            {
                if (price > peak)
                    peak = price;

                var drawdown = (peak - price) / peak;
                if (drawdown > maxDrawdown)
                    maxDrawdown = drawdown;
            }

            var maxDrawdownPercent = maxDrawdown * 100;

            _cache.Set(cacheKey, maxDrawdownPercent, TimeSpan.FromHours(1));
            return maxDrawdownPercent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating max drawdown for stock ID {StockId}", stockId);
            return 0;
        }
    }

    public async Task<PerformanceMetricsDto> CalculatePerformanceMetricsAsync(int stockId, CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = $"performance_{stockId}";
            if (_cache.TryGetValue(cacheKey, out PerformanceMetricsDto? cachedPerformance) && cachedPerformance != null)
                return cachedPerformance;

            var currentDate = DateTime.UtcNow.Date;
            var oneYearAgo = currentDate.AddDays(-365);

            var priceData = await _context.StockPrices
                .Where(sp => sp.StockId == stockId && sp.Date >= oneYearAgo && sp.Date <= currentDate)
                .OrderBy(sp => sp.Date)
                .Select(sp => new { sp.Date, sp.Close, sp.High, sp.Low })
                .ToListAsync(cancellationToken);

            if (!priceData.Any())
                return new PerformanceMetricsDto();

            var currentPrice = priceData.Last().Close;
            var performance = new PerformanceMetricsDto();

            // Calculate returns for different periods
            performance.OneDay = CalculateReturn(priceData, currentDate.AddDays(-1), currentPrice);
            performance.OneWeek = CalculateReturn(priceData, currentDate.AddDays(-7), currentPrice);
            performance.OneMonth = CalculateReturn(priceData, currentDate.AddDays(-30), currentPrice);
            performance.ThreeMonth = CalculateReturn(priceData, currentDate.AddDays(-90), currentPrice);
            performance.SixMonth = CalculateReturn(priceData, currentDate.AddDays(-180), currentPrice);
            performance.OneYear = CalculateReturn(priceData, currentDate.AddDays(-365), currentPrice);

            // Year-to-date performance
            var ytdStart = new DateTime(currentDate.Year, 1, 1);
            performance.YearToDate = CalculateReturn(priceData, ytdStart, currentPrice);

            _cache.Set(cacheKey, performance, TimeSpan.FromMinutes(30));
            return performance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating performance metrics for stock ID {StockId}", stockId);
            return new PerformanceMetricsDto();
        }
    }    private decimal CalculateReturn<T>(List<T> priceData, DateTime startDate, decimal currentPrice) where T : class
    {
        var startPrice = priceData
            .Where(p => (p as dynamic).Date >= startDate)
            .OrderBy(p => (p as dynamic).Date)
            .FirstOrDefault();

        if (startPrice == null)
            return 0;

        var startClosePrice = (decimal)(startPrice as dynamic)!.Close;
        if (startClosePrice == 0)
            return 0;

        return ((currentPrice - startClosePrice) / startClosePrice) * 100;
    }
}
