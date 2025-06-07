namespace Api.Models.DTOs;

/// <summary>
/// Data transfer object for statistical analysis data
/// </summary>
public class StatisticalAnalysisDto
{
    /// <summary>
    /// Historical volatility (annualized)
    /// </summary>
    public decimal Volatility { get; set; }
    
    /// <summary>
    /// Beta coefficient relative to market index
    /// </summary>
    public decimal Beta { get; set; }
    
    /// <summary>
    /// Correlation with market index
    /// </summary>
    public decimal Correlation { get; set; }
    
    /// <summary>
    /// Sharpe ratio (risk-adjusted return)
    /// </summary>
    public decimal SharpeRatio { get; set; }
    
    /// <summary>
    /// Value at Risk (95% confidence)
    /// </summary>
    public decimal VaR95 { get; set; }
    
    /// <summary>
    /// Maximum drawdown percentage
    /// </summary>
    public decimal MaxDrawdown { get; set; }
    
    /// <summary>
    /// Average daily return
    /// </summary>
    public decimal AverageDailyReturn { get; set; }
    
    /// <summary>
    /// Standard deviation of daily returns
    /// </summary>
    public decimal StandardDeviation { get; set; }
    
    /// <summary>
    /// Performance metrics over different time periods
    /// </summary>
    public PerformanceMetricsDto Performance { get; set; } = new();
    
    /// <summary>
    /// When these statistics were calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// Performance metrics for different time periods
/// </summary>
public class PerformanceMetricsDto
{
    /// <summary>
    /// 1-day return percentage
    /// </summary>
    public decimal OneDay { get; set; }
    
    /// <summary>
    /// 1-week return percentage
    /// </summary>
    public decimal OneWeek { get; set; }
    
    /// <summary>
    /// 1-month return percentage
    /// </summary>
    public decimal OneMonth { get; set; }
    
    /// <summary>
    /// 3-month return percentage
    /// </summary>
    public decimal ThreeMonth { get; set; }
    
    /// <summary>
    /// 6-month return percentage
    /// </summary>
    public decimal SixMonth { get; set; }
    
    /// <summary>
    /// Year-to-date return percentage
    /// </summary>
    public decimal YearToDate { get; set; }
    
    /// <summary>
    /// 1-year return percentage
    /// </summary>
    public decimal OneYear { get; set; }
    
    /// <summary>
    /// 52-week high price
    /// </summary>
    public decimal FiftyTwoWeekHigh { get; set; }
    
    /// <summary>
    /// 52-week low price
    /// </summary>
    public decimal FiftyTwoWeekLow { get; set; }
}
