namespace Api.Models.DTOs;

/// <summary>
/// Comprehensive data transfer object containing all calculated metrics for a stock
/// </summary>
public class StockCalculationsDto
{
    /// <summary>
    /// Stock symbol
    /// </summary>
    public string Symbol { get; set; } = string.Empty;
    
    /// <summary>
    /// Stock ID
    /// </summary>
    public int StockId { get; set; }
    
    /// <summary>
    /// Basic price metrics and calculations
    /// </summary>
    public CalculatedMetricsDto PriceMetrics { get; set; } = new();
    
    /// <summary>
    /// Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, etc.)
    /// </summary>
    public TechnicalIndicatorsDto TechnicalIndicators { get; set; } = new();
    
    /// <summary>
    /// Statistical analysis (volatility, beta, correlation, risk metrics)
    /// </summary>
    public StatisticalAnalysisDto Statistics { get; set; } = new();
    
    /// <summary>
    /// When these calculations were performed
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}
