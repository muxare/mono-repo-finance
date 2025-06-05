namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for Stock Price information
/// </summary>
public class StockPriceDto
{
    public long Id { get; set; }
    
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
    public decimal? AdjustedClose { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Calculated fields
    public decimal? PriceChange { get; set; }
    public decimal? ChangePercent { get; set; }
}
