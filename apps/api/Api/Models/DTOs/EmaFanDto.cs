namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for EMA Fan analysis results
/// </summary>
public class EmaFanDto
{
    /// <summary>
    /// Stock identifier
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// Stock symbol
    /// </summary>
    public string Symbol { get; set; } = string.Empty;
    
    /// <summary>
    /// Company name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Sector name
    /// </summary>
    public string SectorName { get; set; } = string.Empty;
    
    /// <summary>
    /// Latest price
    /// </summary>
    public decimal? LatestPrice { get; set; }
    
    /// <summary>
    /// EMA values for different periods
    /// </summary>
    public decimal? Ema18 { get; set; }
    public decimal? Ema50 { get; set; }
    public decimal? Ema100 { get; set; }
    public decimal? Ema200 { get; set; }
    
    /// <summary>
    /// EMA Fan score (0-3): number of consecutive EMA conditions satisfied
    /// 3 = Perfect fan (ema18 > ema50 > ema100 > ema200)
    /// 2 = Two conditions satisfied
    /// 1 = One condition satisfied
    /// 0 = No conditions satisfied
    /// </summary>
    public int EmaFanScore { get; set; }
    
    /// <summary>
    /// Whether the stock satisfies the complete EMA Fan condition
    /// </summary>
    public bool IsPerfectEmaFan { get; set; }
    
    /// <summary>
    /// Percentage above/below the EMA fan alignment (for perfect fans)
    /// </summary>
    public decimal? FanStrength { get; set; }
}
