namespace Api.Models.Entities;

/// <summary>
/// Represents a publicly traded stock/security
/// </summary>
public class Stock
{
    public int Id { get; set; }
    
    /// <summary>
    /// Stock ticker symbol (e.g., "AAPL", "GOOGL")
    /// </summary>
    public string Symbol { get; set; } = string.Empty;
    
    /// <summary>
    /// Company name (e.g., "Apple Inc.", "Alphabet Inc.")
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Foreign key to Sector
    /// </summary>
    public int SectorId { get; set; }
    
    /// <summary>
    /// Foreign key to Exchange
    /// </summary>
    public int ExchangeId { get; set; }
    
    /// <summary>
    /// Market capitalization in USD
    /// </summary>
    public decimal? MarketCap { get; set; }
    
    /// <summary>
    /// Company description/business summary
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Number of outstanding shares
    /// </summary>
    public long? OutstandingShares { get; set; }
    
    /// <summary>
    /// Indicates if the stock is actively traded
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation Properties
    public Sector Sector { get; set; } = null!;
    public Exchange Exchange { get; set; } = null!;
    public ICollection<StockPrice> Prices { get; set; } = new List<StockPrice>();
}
