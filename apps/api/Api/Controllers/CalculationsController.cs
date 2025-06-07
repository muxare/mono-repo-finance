using Api.Models.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Controller for financial calculations and metrics
/// </summary>
[ApiController]
[Route("api/stocks/{symbol}/[controller]")]
[Produces("application/json")]
public class CalculationsController : ControllerBase
{    private readonly IStockService _stockService;
    private readonly IPriceCalculationService _priceCalculationService;
    private readonly ITechnicalIndicatorService _technicalIndicatorService;
    private readonly IStatisticalAnalysisService _statisticalAnalysisService;
    private readonly ICalculationJobService _calculationJobService;
    private readonly ILogger<CalculationsController> _logger;

    public CalculationsController(
        IStockService stockService,
        IPriceCalculationService priceCalculationService,
        ITechnicalIndicatorService technicalIndicatorService,
        IStatisticalAnalysisService statisticalAnalysisService,
        ICalculationJobService calculationJobService,
        ILogger<CalculationsController> logger)
    {
        _stockService = stockService;
        _priceCalculationService = priceCalculationService;
        _technicalIndicatorService = technicalIndicatorService;
        _statisticalAnalysisService = statisticalAnalysisService;
        _calculationJobService = calculationJobService;
        _logger = logger;
    }

    /// <summary>
    /// Get all pre-calculated metrics for a stock
    /// </summary>
    /// <param name="symbol">Stock symbol</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>All calculated metrics including price, technical indicators, and statistics</returns>
    [HttpGet]
    [ProducesResponseType(typeof(StockCalculationsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<StockCalculationsDto>> GetCalculations(
        string symbol, 
        CancellationToken cancellationToken = default)
    {        try
        {
            var stock = await _stockService.GetStockBySymbolAsync(symbol);
            if (stock == null)
            {
                return NotFound($"Stock with symbol '{symbol}' not found");
            }

            // Check for cached calculations first
            var cachedCalculations = await _calculationJobService.GetCachedCalculationsAsync(stock.Id, cancellationToken);
            if (cachedCalculations != null)
            {
                _logger.LogDebug("Returning cached calculations for stock {Symbol}", symbol);
                return Ok(cachedCalculations);
            }

            var calculations = new StockCalculationsDto
            {
                Symbol = symbol,
                StockId = stock.Id
            };

            // Calculate all metrics in parallel
            var priceMetricsTask = _priceCalculationService.CalculatePriceMetricsAsync(stock.Id, cancellationToken);
            var indicatorsTask = _technicalIndicatorService.CalculateIndicatorsAsync(stock.Id, cancellationToken);
            var statisticsTask = _statisticalAnalysisService.CalculateStatisticsAsync(stock.Id, cancellationToken);

            await Task.WhenAll(priceMetricsTask, indicatorsTask, statisticsTask);

            calculations.PriceMetrics = await priceMetricsTask;
            calculations.TechnicalIndicators = await indicatorsTask;
            calculations.Statistics = await statisticsTask;
            calculations.CalculatedAt = DateTime.UtcNow;

            // Cache the results
            await _calculationJobService.CacheCalculationsAsync(stock.Id, calculations, cancellationToken: cancellationToken);

            return Ok(calculations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving calculations for stock symbol {Symbol}", symbol);
            return StatusCode(500, "An error occurred while calculating metrics");
        }
    }

    /// <summary>
    /// Get technical indicators for a stock with optional parameters
    /// </summary>
    /// <param name="symbol">Stock symbol</param>
    /// <param name="smaPeriods">SMA periods (comma-separated, e.g., "20,50,200")</param>
    /// <param name="emaPeriods">EMA periods (comma-separated, e.g., "12,26,50")</param>
    /// <param name="rsiPeriod">RSI period (default 14)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Technical indicators</returns>
    [HttpGet("indicators")]
    [ProducesResponseType(typeof(TechnicalIndicatorsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TechnicalIndicatorsDto>> GetIndicators(
        string symbol,
        [FromQuery] string? smaPeriods = null,
        [FromQuery] string? emaPeriods = null,
        [FromQuery] int rsiPeriod = 14,
        CancellationToken cancellationToken = default)
    {        try
        {
            var stock = await _stockService.GetStockBySymbolAsync(symbol);
            if (stock == null)
            {
                return NotFound($"Stock with symbol '{symbol}' not found");
            }

            var indicators = new TechnicalIndicatorsDto();

            // Parse periods from query parameters
            var smaPeriodsArray = ParsePeriods(smaPeriods, new[] { 20, 50, 200 });
            var emaPeriodsArray = ParsePeriods(emaPeriods, new[] { 12, 26, 50 });

            // Calculate indicators in parallel
            var smaTask = _technicalIndicatorService.CalculateSMAAsync(stock.Id, smaPeriodsArray, cancellationToken);
            var emaTask = _technicalIndicatorService.CalculateEMAAsync(stock.Id, emaPeriodsArray, cancellationToken);
            var rsiTask = _technicalIndicatorService.CalculateRSIAsync(stock.Id, rsiPeriod, cancellationToken);
            var macdTask = _technicalIndicatorService.CalculateMACDAsync(stock.Id, cancellationToken: cancellationToken);
            var bollingerTask = _technicalIndicatorService.CalculateBollingerBandsAsync(stock.Id, cancellationToken: cancellationToken);
            var supportResistanceTask = _technicalIndicatorService.CalculateSupportResistanceAsync(stock.Id, cancellationToken: cancellationToken);

            await Task.WhenAll(smaTask, emaTask, rsiTask, macdTask, bollingerTask, supportResistanceTask);

            indicators.SMA = await smaTask;
            indicators.EMA = await emaTask;
            indicators.RSI = await rsiTask;
            indicators.MACD = await macdTask;
            indicators.BollingerBands = await bollingerTask;
            indicators.SupportResistance = await supportResistanceTask;
            indicators.CalculatedAt = DateTime.UtcNow;

            return Ok(indicators);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating indicators for stock symbol {Symbol}", symbol);
            return StatusCode(500, "An error occurred while calculating indicators");
        }
    }

    /// <summary>
    /// Get statistical analysis data for a stock
    /// </summary>
    /// <param name="symbol">Stock symbol</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistical analysis data</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(StatisticalAnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<StatisticalAnalysisDto>> GetStatistics(
        string symbol,
        CancellationToken cancellationToken = default)
    {        try
        {
            var stock = await _stockService.GetStockBySymbolAsync(symbol);
            if (stock == null)
            {
                return NotFound($"Stock with symbol '{symbol}' not found");
            }

            var statistics = await _statisticalAnalysisService.CalculateStatisticsAsync(stock.Id, cancellationToken);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating statistics for stock symbol {Symbol}", symbol);
            return StatusCode(500, "An error occurred while calculating statistics");
        }
    }

    /// <summary>
    /// Get performance metrics over different time periods
    /// </summary>
    /// <param name="symbol">Stock symbol</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Performance metrics</returns>
    [HttpGet("performance")]
    [ProducesResponseType(typeof(PerformanceMetricsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PerformanceMetricsDto>> GetPerformance(
        string symbol,
        CancellationToken cancellationToken = default)
    {        try
        {
            var stock = await _stockService.GetStockBySymbolAsync(symbol);
            if (stock == null)
            {
                return NotFound($"Stock with symbol '{symbol}' not found");
            }

            var performance = await _statisticalAnalysisService.CalculatePerformanceMetricsAsync(stock.Id, cancellationToken);
            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating performance for stock symbol {Symbol}", symbol);
            return StatusCode(500, "An error occurred while calculating performance");
        }
    }

    private static int[] ParsePeriods(string? periodsString, int[] defaultPeriods)
    {
        if (string.IsNullOrWhiteSpace(periodsString))
            return defaultPeriods;

        try
        {
            return periodsString
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .Where(p => p > 0)
                .ToArray();
        }
        catch
        {
            return defaultPeriods;
        }
    }
}
