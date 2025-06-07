using Api.Data;
using Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

/// <summary>
/// Service for calculating technical indicators
/// </summary>
public class TechnicalIndicatorService : ITechnicalIndicatorService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<TechnicalIndicatorService> _logger;

    public TechnicalIndicatorService(FinanceDbContext context, ILogger<TechnicalIndicatorService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<TechnicalIndicatorsDto> CalculateIndicatorsAsync(int stockId, CancellationToken cancellationToken = default)
    {
        try
        {
            var indicators = new TechnicalIndicatorsDto();

            // Calculate common periods
            var smaPeriods = new[] { 20, 50, 200 };
            var emaPeriods = new[] { 12, 26, 50 };

            // Calculate all indicators in parallel
            var smaTask = CalculateSMAAsync(stockId, smaPeriods, cancellationToken);
            var emaTask = CalculateEMAAsync(stockId, emaPeriods, cancellationToken);
            var rsiTask = CalculateRSIAsync(stockId, 14, cancellationToken);
            var macdTask = CalculateMACDAsync(stockId, 12, 26, 9, cancellationToken);
            var bollingerTask = CalculateBollingerBandsAsync(stockId, 20, 2m, cancellationToken);
            var supportResistanceTask = CalculateSupportResistanceAsync(stockId, 90, cancellationToken);

            await Task.WhenAll(smaTask, emaTask, rsiTask, macdTask, bollingerTask, supportResistanceTask);

            indicators.SMA = await smaTask;
            indicators.EMA = await emaTask;
            indicators.RSI = await rsiTask;
            indicators.MACD = await macdTask;
            indicators.BollingerBands = await bollingerTask;
            indicators.SupportResistance = await supportResistanceTask;
            indicators.CalculatedAt = DateTime.UtcNow;

            return indicators;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating technical indicators for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<Dictionary<int, decimal>> CalculateSMAAsync(int stockId, int[] periods, CancellationToken cancellationToken = default)
    {
        try
        {
            var maxPeriod = periods.Max();
            var prices = await GetRecentClosingPrices(stockId, maxPeriod, cancellationToken);
            var result = new Dictionary<int, decimal>();

            foreach (var period in periods)
            {
                if (prices.Count >= period)
                {
                    var smaValues = prices.TakeLast(period);
                    result[period] = smaValues.Average();
                }
                else
                {
                    result[period] = 0;
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating SMA for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<Dictionary<int, decimal>> CalculateEMAAsync(int stockId, int[] periods, CancellationToken cancellationToken = default)
    {
        try
        {
            var maxPeriod = periods.Max();
            var prices = await GetRecentClosingPrices(stockId, maxPeriod * 3, cancellationToken); // Get more data for EMA
            var result = new Dictionary<int, decimal>();

            foreach (var period in periods)
            {
                if (prices.Count >= period)
                {
                    result[period] = CalculateEMA(prices, period);
                }
                else
                {
                    result[period] = 0;
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating EMA for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<decimal> CalculateRSIAsync(int stockId, int period = 14, CancellationToken cancellationToken = default)
    {
        try
        {
            var prices = await GetRecentClosingPrices(stockId, period + 1, cancellationToken);
            
            if (prices.Count < period + 1)
                return 0;

            var gains = new List<decimal>();
            var losses = new List<decimal>();

            for (int i = 1; i < prices.Count; i++)
            {
                var change = prices[i] - prices[i - 1];
                gains.Add(change > 0 ? change : 0);
                losses.Add(change < 0 ? Math.Abs(change) : 0);
            }

            var avgGain = gains.TakeLast(period).Average();
            var avgLoss = losses.TakeLast(period).Average();

            if (avgLoss == 0) return 100; // No losses, RSI = 100

            var rs = avgGain / avgLoss;
            var rsi = 100 - (100 / (1 + rs));

            return rsi;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating RSI for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<MacdDataDto> CalculateMACDAsync(int stockId, int fastPeriod = 12, int slowPeriod = 26, int signalPeriod = 9, CancellationToken cancellationToken = default)
    {
        try
        {
            var prices = await GetRecentClosingPrices(stockId, slowPeriod * 3, cancellationToken);
            
            if (prices.Count < slowPeriod)
            {
                return new MacdDataDto();
            }

            var fastEMA = CalculateEMA(prices, fastPeriod);
            var slowEMA = CalculateEMA(prices, slowPeriod);
            var macd = fastEMA - slowEMA;

            // Calculate signal line (EMA of MACD)
            // For simplicity, we'll use a basic moving average instead of calculating EMA of MACD
            var signal = macd; // This should be improved with proper MACD history

            return new MacdDataDto
            {
                MACD = macd,
                Signal = signal,
                Histogram = macd - signal
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating MACD for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<BollingerBandsDto> CalculateBollingerBandsAsync(int stockId, int period = 20, decimal standardDeviations = 2m, CancellationToken cancellationToken = default)
    {
        try
        {
            var prices = await GetRecentClosingPrices(stockId, period, cancellationToken);
            
            if (prices.Count < period)
            {
                return new BollingerBandsDto();
            }

            var sma = prices.TakeLast(period).Average();
            var variance = prices.TakeLast(period).Sum(p => (p - sma) * (p - sma)) / period;
            var stdDev = (decimal)Math.Sqrt((double)variance);

            var upper = sma + (standardDeviations * stdDev);
            var lower = sma - (standardDeviations * stdDev);
            var width = ((upper - lower) / sma) * 100;

            return new BollingerBandsDto
            {
                Upper = upper,
                Middle = sma,
                Lower = lower,
                Width = width
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating Bollinger Bands for stock ID {StockId}", stockId);
            throw;
        }
    }

    public async Task<SupportResistanceDto> CalculateSupportResistanceAsync(int stockId, int lookbackDays = 90, CancellationToken cancellationToken = default)
    {
        try
        {
            var priceData = await _context.StockPrices
                .Where(p => p.StockId == stockId)
                .OrderByDescending(p => p.Date)
                .Take(lookbackDays)
                .Select(p => new { p.High, p.Low, p.Close })
                .ToListAsync(cancellationToken);

            if (!priceData.Any())
            {
                return new SupportResistanceDto();
            }

            // Simple support/resistance calculation
            var prices = priceData.SelectMany(p => new[] { p.High, p.Low, p.Close }).ToList();
            prices.Sort();

            var support = prices.Take(prices.Count / 4).Average(); // Bottom quartile
            var resistance = prices.TakeLast(prices.Count / 4).Average(); // Top quartile

            return new SupportResistanceDto
            {
                Support = support,
                Resistance = resistance,
                Strength = 0.5m // Placeholder - could be improved with proper strength calculation
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating support/resistance for stock ID {StockId}", stockId);
            throw;
        }
    }

    private async Task<List<decimal>> GetRecentClosingPrices(int stockId, int count, CancellationToken cancellationToken)
    {
        return await _context.StockPrices
            .Where(p => p.StockId == stockId)
            .OrderByDescending(p => p.Date)
            .Take(count)
            .OrderBy(p => p.Date)
            .Select(p => p.Close)
            .ToListAsync(cancellationToken);
    }

    private static decimal CalculateEMA(List<decimal> prices, int period)
    {
        if (prices.Count < period) return 0;

        var multiplier = 2m / (period + 1);
        var ema = prices.Take(period).Average(); // Start with SMA

        for (int i = period; i < prices.Count; i++)
        {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }

        return ema;
    }
}
