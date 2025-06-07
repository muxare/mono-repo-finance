namespace Api.Models.DTOs;

/// <summary>
/// Data transfer object for technical indicators
/// </summary>
public class TechnicalIndicatorsDto
{
    /// <summary>
    /// Simple Moving Averages for various periods
    /// </summary>
    public Dictionary<int, decimal> SMA { get; set; } = new();
    
    /// <summary>
    /// Exponential Moving Averages for various periods
    /// </summary>
    public Dictionary<int, decimal> EMA { get; set; } = new();
    
    /// <summary>
    /// Relative Strength Index (0-100)
    /// </summary>
    public decimal RSI { get; set; }
    
    /// <summary>
    /// MACD line data
    /// </summary>
    public MacdDataDto MACD { get; set; } = new();
    
    /// <summary>
    /// Bollinger Bands data
    /// </summary>
    public BollingerBandsDto BollingerBands { get; set; } = new();
    
    /// <summary>
    /// Support and resistance levels
    /// </summary>
    public SupportResistanceDto SupportResistance { get; set; } = new();
    
    /// <summary>
    /// When these indicators were calculated
    /// </summary>
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// MACD indicator data
/// </summary>
public class MacdDataDto
{
    /// <summary>
    /// MACD line value
    /// </summary>
    public decimal MACD { get; set; }
    
    /// <summary>
    /// Signal line value
    /// </summary>
    public decimal Signal { get; set; }
    
    /// <summary>
    /// Histogram value (MACD - Signal)
    /// </summary>
    public decimal Histogram { get; set; }
}

/// <summary>
/// Bollinger Bands data
/// </summary>
public class BollingerBandsDto
{
    /// <summary>
    /// Upper band value
    /// </summary>
    public decimal Upper { get; set; }
    
    /// <summary>
    /// Middle band value (SMA)
    /// </summary>
    public decimal Middle { get; set; }
    
    /// <summary>
    /// Lower band value
    /// </summary>
    public decimal Lower { get; set; }
    
    /// <summary>
    /// Band width percentage
    /// </summary>
    public decimal Width { get; set; }
}

/// <summary>
/// Support and resistance levels
/// </summary>
public class SupportResistanceDto
{
    /// <summary>
    /// Primary support level (price level where stock tends to bounce up)
    /// </summary>
    public decimal Support { get; set; }
    
    /// <summary>
    /// Primary resistance level (price level where stock tends to bounce down)
    /// </summary>
    public decimal Resistance { get; set; }
    
    /// <summary>
    /// Strength of the support/resistance levels (0-1)
    /// </summary>
    public decimal Strength { get; set; }
}
