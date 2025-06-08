namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for EMA Fan market summary statistics
/// </summary>
public class EmaFanSummaryDto
{
    /// <summary>
    /// Total number of stocks analyzed
    /// </summary>
    public int TotalStocksAnalyzed { get; set; }
    
    /// <summary>
    /// Number of stocks with perfect EMA Fan (score = 3)
    /// </summary>
    public int PerfectEmaFanCount { get; set; }
    
    /// <summary>
    /// Percentage of stocks with perfect EMA Fan
    /// </summary>
    public decimal PerfectEmaFanPercentage => TotalStocksAnalyzed > 0 
        ? Math.Round((decimal)PerfectEmaFanCount / TotalStocksAnalyzed * 100, 2) 
        : 0;
    
    /// <summary>
    /// Distribution of EMA Fan scores across all stocks
    /// </summary>
    public Dictionary<int, int> ScoreDistribution { get; set; } = new();
    
    /// <summary>
    /// Average fan strength for stocks with perfect EMA Fan
    /// </summary>
    public decimal AverageFanStrength { get; set; }
    
    /// <summary>
    /// Top 5 sectors by number of perfect EMA Fan stocks
    /// </summary>
    public Dictionary<string, int> TopSectors { get; set; } = new();
}
