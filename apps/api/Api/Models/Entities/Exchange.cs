namespace Api.Models.Entities;

/// <summary>
/// Represents a stock exchange where stocks are traded
/// </summary>
public class Exchange
{
    public int Id { get; set; }
    
    /// <summary>
    /// Exchange name (e.g., "NASDAQ", "NYSE")
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Exchange code (e.g., "NASDAQ", "NYSE")
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Country where the exchange is located
    /// </summary>
    public string Country { get; set; } = string.Empty;
    
    /// <summary>
    /// Timezone of the exchange
    /// </summary>
    public string Timezone { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation Properties
    public ICollection<Stock> Stocks { get; set; } = new List<Stock>();
}
