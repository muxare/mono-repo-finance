namespace Api.Models.DTOs;

/// <summary>
/// Lightweight Data Transfer Object for Stock list items (optimized for pagination)
/// </summary>
public class StockSummaryDto
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SectorName { get; set; } = string.Empty;
    public string ExchangeCode { get; set; } = string.Empty;
    public decimal? MarketCap { get; set; }
    public bool IsActive { get; set; }
    
    // Latest price information (if available)
    public decimal? LatestPrice { get; set; }
    public decimal? PriceChange { get; set; }
    public decimal? ChangePercent { get; set; }
    public DateTime? LastPriceUpdate { get; set; }
}
