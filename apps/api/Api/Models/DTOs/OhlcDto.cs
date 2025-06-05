namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for OHLC (Open, High, Low, Close) price data
/// </summary>
public class OhlcDto
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
}
