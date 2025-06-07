using Api.Models.DTOs;
using Api.Services;
using Hangfire;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace Api.Services;

/// <summary>
/// Service for managing background calculation jobs and caching
/// </summary>
public class CalculationJobService : ICalculationJobService
{
    private readonly IMemoryCache _cache;
    private readonly IStockService _stockService;
    private readonly IPriceCalculationService _priceCalculationService;
    private readonly ITechnicalIndicatorService _technicalIndicatorService;
    private readonly IStatisticalAnalysisService _statisticalAnalysisService;
    private readonly ILogger<CalculationJobService> _logger;
    private readonly TimeSpan _defaultCacheExpiration = TimeSpan.FromMinutes(15);

    public CalculationJobService(
        IMemoryCache cache,
        IStockService stockService,
        IPriceCalculationService priceCalculationService,
        ITechnicalIndicatorService technicalIndicatorService,
        IStatisticalAnalysisService statisticalAnalysisService,
        ILogger<CalculationJobService> logger)
    {
        _cache = cache;
        _stockService = stockService;
        _priceCalculationService = priceCalculationService;
        _technicalIndicatorService = technicalIndicatorService;
        _statisticalAnalysisService = statisticalAnalysisService;
        _logger = logger;
    }

    public Task<string> EnqueueStockCalculationAsync(int stockId)
    {
        var jobId = BackgroundJob.Enqueue(() => CalculateAndCacheStockMetricsAsync(stockId, CancellationToken.None));
        _logger.LogInformation("Enqueued calculation job {JobId} for stock ID {StockId}", jobId, stockId);
        return Task.FromResult(jobId);
    }    public Task<string> EnqueueAllStocksCalculationAsync()
    {
        var jobId = BackgroundJob.Enqueue(() => CalculateAllStocksAsync(CancellationToken.None));
        _logger.LogInformation("Enqueued calculation job {JobId} for all stocks", jobId);
        return Task.FromResult(jobId);
    }

    public Task ScheduleRecurringCalculationsAsync()
    {
        // Schedule calculations to run every hour during market hours
        RecurringJob.AddOrUpdate(
            "hourly-calculations",
            () => CalculateAllStocksAsync(CancellationToken.None),
            "0 * * * *"); // Every hour

        // Schedule end-of-day calculations
        RecurringJob.AddOrUpdate(
            "end-of-day-calculations",
            () => CalculateAllStocksAsync(CancellationToken.None),
            "0 22 * * 1-5"); // 10 PM on weekdays

        _logger.LogInformation("Scheduled recurring calculation jobs");
        return Task.CompletedTask;
    }

    public Task<StockCalculationsDto?> GetCachedCalculationsAsync(int stockId, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetCacheKey(stockId);
        var cached = _cache.Get<StockCalculationsDto>(cacheKey);
        return Task.FromResult(cached);
    }

    public Task CacheCalculationsAsync(int stockId, StockCalculationsDto calculations, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetCacheKey(stockId);
        var cacheExpiration = expiration ?? _defaultCacheExpiration;
        
        _cache.Set(cacheKey, calculations, cacheExpiration);
        _logger.LogDebug("Cached calculations for stock ID {StockId} with expiration {Expiration}", stockId, cacheExpiration);
        
        return Task.CompletedTask;
    }

    public Task InvalidateCacheAsync(int stockId, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetCacheKey(stockId);
        _cache.Remove(cacheKey);
        _logger.LogDebug("Invalidated cache for stock ID {StockId}", stockId);
        return Task.CompletedTask;
    }

    public Task InvalidateAllCachesAsync(CancellationToken cancellationToken = default)
    {
        // Note: IMemoryCache doesn't have a clear all method
        // In a production environment, you'd want to use Redis or another cache that supports pattern-based clearing
        _logger.LogInformation("Cache invalidation requested for all stocks");
        return Task.CompletedTask;
    }

    /// <summary>
    /// Background job method to calculate metrics for a single stock
    /// </summary>
    [Queue("calculations")]
    public async Task CalculateAndCacheStockMetricsAsync(int stockId, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting calculation for stock ID {StockId}", stockId);            var stock = await _stockService.GetStockByIdAsync(stockId);
            if (stock == null)
            {
                _logger.LogWarning("Stock ID {StockId} not found, skipping calculation", stockId);
                return;
            }

            var calculations = new StockCalculationsDto
            {
                Symbol = stock.Symbol,
                StockId = stockId
            };

            // Calculate all metrics in parallel
            var priceMetricsTask = _priceCalculationService.CalculatePriceMetricsAsync(stockId, cancellationToken);
            var indicatorsTask = _technicalIndicatorService.CalculateIndicatorsAsync(stockId, cancellationToken);
            var statisticsTask = _statisticalAnalysisService.CalculateStatisticsAsync(stockId, cancellationToken);

            await Task.WhenAll(priceMetricsTask, indicatorsTask, statisticsTask);

            calculations.PriceMetrics = await priceMetricsTask;
            calculations.TechnicalIndicators = await indicatorsTask;
            calculations.Statistics = await statisticsTask;
            calculations.CalculatedAt = DateTime.UtcNow;

            // Cache the results
            await CacheCalculationsAsync(stockId, calculations, cancellationToken: cancellationToken);

            _logger.LogInformation("Completed calculation for stock {Symbol} (ID: {StockId})", stock.Symbol, stockId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating metrics for stock ID {StockId}", stockId);
            throw;
        }
    }

    /// <summary>
    /// Background job method to calculate metrics for all active stocks
    /// </summary>
    [Queue("calculations")]
    public async Task CalculateAllStocksAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting calculation for all active stocks");            var stockQuery = new StockQueryParameters { Page = 1, PageSize = int.MaxValue };
            var stocks = await _stockService.GetStocksAsync(stockQuery);
            var activeStocks = stocks.Data.Where(s => s.IsActive).ToList();

            _logger.LogInformation("Found {Count} active stocks to calculate", activeStocks.Count);

            // Process stocks in batches to avoid overwhelming the system
            const int batchSize = 10;
            var batches = activeStocks.Chunk(batchSize);

            foreach (var batch in batches)
            {
                var tasks = batch.Select(stock => CalculateAndCacheStockMetricsAsync(stock.Id, cancellationToken));
                await Task.WhenAll(tasks);
                
                // Small delay between batches to avoid database overload
                await Task.Delay(1000, cancellationToken);
            }

            _logger.LogInformation("Completed calculation for all active stocks");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating metrics for all stocks");
            throw;
        }
    }

    private static string GetCacheKey(int stockId) => $"calculations:stock:{stockId}";
}
