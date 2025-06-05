namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for Stock information
/// </summary>
public class StockDto
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal? MarketCap { get; set; }
    public string? Description { get; set; }
    public long? OutstandingShares { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Related entity information
    public SectorDto Sector { get; set; } = null!;
    public ExchangeDto Exchange { get; set; } = null!;
    
    // Latest price information (if available)
    public decimal? LatestPrice { get; set; }
    public decimal? PriceChange { get; set; }
    public decimal? ChangePercent { get; set; }
    public DateTime? LastPriceUpdate { get; set; }
}
