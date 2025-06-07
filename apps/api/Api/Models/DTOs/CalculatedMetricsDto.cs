namespace Api.Models.DTOs;

/// <summary>
/// Data transfer object for calculated price metrics
/// </summary>
public class CalculatedMetricsDto
{
    /// <summary>
    /// Absolute price change from previous close
    /// </summary>
    public decimal PriceChange { get; set; }
    
    /// <summary>
    /// Percentage change from previous close
    /// </summary>
    public decimal ChangePercent { get; set; }
    
    /// <summary>
    /// Current day's high price
    /// </summary>
    public decimal DayHigh { get; set; }
    
    /// <summary>
    /// Current day's low price
    /// </summary>
    public decimal DayLow { get; set; }
    
    /// <summary>
    /// Volume Weighted Average Price
    /// </summary>
    public decimal VWAP { get; set; }
    
    /// <summary>
    /// Historical volatility (standard deviation of returns)
    /// </summary>
    public decimal Volatility { get; set; }
    
    /// <summary>
    /// Gap percentage (difference between open and previous close)
    /// </summary>
    public decimal GapPercent { get; set; }
    
    /// <summary>
    /// When these metrics were calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}
