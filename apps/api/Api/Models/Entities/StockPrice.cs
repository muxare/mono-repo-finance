namespace Api.Models.Entities;

/// <summary>
/// Represents historical stock price data (OHLCV)
/// </summary>
public class StockPrice
{
    public long Id { get; set; }
    
    /// <summary>
    /// Foreign key to Stock
    /// </summary>
    public int StockId { get; set; }
    
    /// <summary>
    /// Trading date (date only, no time component)
    /// </summary>
    public DateTime Date { get; set; }
    
    /// <summary>
    /// Opening price for the trading day
    /// </summary>
    public decimal Open { get; set; }
    
    /// <summary>
    /// Highest price during the trading day
    /// </summary>
    public decimal High { get; set; }
    
    /// <summary>
    /// Lowest price during the trading day
    /// </summary>
    public decimal Low { get; set; }
    
    /// <summary>
    /// Closing price for the trading day
    /// </summary>
    public decimal Close { get; set; }
    
    /// <summary>
    /// Trading volume (number of shares traded)
    /// </summary>
    public long Volume { get; set; }
    
    /// <summary>
    /// Adjusted closing price (accounts for stock splits, dividends)
    /// </summary>
    public decimal? AdjustedClose { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    // Navigation Property
    public Stock Stock { get; set; } = null!;
}
