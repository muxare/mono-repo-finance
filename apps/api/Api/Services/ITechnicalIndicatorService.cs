using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Interface for technical indicator calculations
/// </summary>
public interface ITechnicalIndicatorService
{
    /// <summary>
    /// Calculate all technical indicators for a stock
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Technical indicators data</returns>
    Task<TechnicalIndicatorsDto> CalculateIndicatorsAsync(int stockId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate Simple Moving Average for specific periods
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="periods">Periods to calculate (e.g., 20, 50, 200)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Dictionary of period to SMA value</returns>
    Task<Dictionary<int, decimal>> CalculateSMAAsync(int stockId, int[] periods, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate Exponential Moving Average for specific periods
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="periods">Periods to calculate (e.g., 12, 26, 50)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Dictionary of period to EMA value</returns>
    Task<Dictionary<int, decimal>> CalculateEMAAsync(int stockId, int[] periods, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate Relative Strength Index
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="period">RSI period (default 14)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>RSI value (0-100)</returns>
    Task<decimal> CalculateRSIAsync(int stockId, int period = 14, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate MACD indicator
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="fastPeriod">Fast EMA period (default 12)</param>
    /// <param name="slowPeriod">Slow EMA period (default 26)</param>
    /// <param name="signalPeriod">Signal line period (default 9)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>MACD data</returns>
    Task<MacdDataDto> CalculateMACDAsync(int stockId, int fastPeriod = 12, int slowPeriod = 26, int signalPeriod = 9, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate Bollinger Bands
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="period">Period for SMA calculation (default 20)</param>
    /// <param name="standardDeviations">Number of standard deviations (default 2)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Bollinger Bands data</returns>
    Task<BollingerBandsDto> CalculateBollingerBandsAsync(int stockId, int period = 20, decimal standardDeviations = 2m, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Identify support and resistance levels
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="lookbackDays">Number of days to analyze (default 90)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Support and resistance levels</returns>
    Task<SupportResistanceDto> CalculateSupportResistanceAsync(int stockId, int lookbackDays = 90, CancellationToken cancellationToken = default);
}
