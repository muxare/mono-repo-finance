using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Interface for statistical analysis calculations
/// </summary>
public interface IStatisticalAnalysisService
{
    /// <summary>
    /// Calculate comprehensive statistical analysis for a stock
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistical analysis data</returns>
    Task<StatisticalAnalysisDto> CalculateStatisticsAsync(int stockId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate historical volatility (annualized)
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="days">Number of days for calculation (default 252 for 1 year)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Annualized volatility</returns>
    Task<decimal> CalculateVolatilityAsync(int stockId, int days = 252, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate beta coefficient relative to market index
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="marketSymbol">Market index symbol (e.g., "SPY" for S&P 500)</param>
    /// <param name="days">Number of days for calculation (default 252)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Beta coefficient</returns>
    Task<decimal> CalculateBetaAsync(int stockId, string marketSymbol = "SPY", int days = 252, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate correlation with another stock or index
    /// </summary>
    /// <param name="stockId1">First stock identifier</param>
    /// <param name="stockId2">Second stock identifier</param>
    /// <param name="days">Number of days for calculation (default 252)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Correlation coefficient (-1 to 1)</returns>
    Task<decimal> CalculateCorrelationAsync(int stockId1, int stockId2, int days = 252, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate Sharpe ratio (risk-adjusted return)
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="riskFreeRate">Risk-free rate (default 0.02 for 2%)</param>
    /// <param name="days">Number of days for calculation (default 252)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Sharpe ratio</returns>
    Task<decimal> CalculateSharpeRatioAsync(int stockId, decimal riskFreeRate = 0.02m, int days = 252, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate Value at Risk (VaR) at 95% confidence level
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="days">Number of days for calculation (default 252)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>VaR as percentage</returns>
    Task<decimal> CalculateVaRAsync(int stockId, int days = 252, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate maximum drawdown
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="days">Number of days for calculation (default 252)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Maximum drawdown as percentage</returns>
    Task<decimal> CalculateMaxDrawdownAsync(int stockId, int days = 252, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Calculate performance metrics over different time periods
    /// </summary>
    /// <param name="stockId">Stock identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Performance metrics</returns>
    Task<PerformanceMetricsDto> CalculatePerformanceMetricsAsync(int stockId, CancellationToken cancellationToken = default);
}
