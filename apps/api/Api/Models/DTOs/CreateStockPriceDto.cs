using System.ComponentModel.DataAnnotations;

namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for creating a new stock price entry
/// </summary>
public class CreateStockPriceDto
{
    /// <summary>
    /// Stock symbol
    /// </summary>
    [Required(ErrorMessage = "Symbol is required")]
    [StringLength(10, MinimumLength = 1, ErrorMessage = "Symbol must be between 1 and 10 characters")]
    public string Symbol { get; set; } = string.Empty;

    /// <summary>
    /// Opening price
    /// </summary>
    [Required(ErrorMessage = "Open price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Open price must be positive")]
    public decimal Open { get; set; }

    /// <summary>
    /// Highest price during the period
    /// </summary>
    [Required(ErrorMessage = "High price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "High price must be positive")]
    public decimal High { get; set; }

    /// <summary>
    /// Lowest price during the period
    /// </summary>
    [Required(ErrorMessage = "Low price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Low price must be positive")]
    public decimal Low { get; set; }

    /// <summary>
    /// Closing price
    /// </summary>
    [Required(ErrorMessage = "Close price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Close price must be positive")]
    public decimal Close { get; set; }

    /// <summary>
    /// Trading volume
    /// </summary>
    [Required(ErrorMessage = "Volume is required")]
    [Range(0, long.MaxValue, ErrorMessage = "Volume must be non-negative")]
    public long Volume { get; set; }

    /// <summary>
    /// Date of the price data
    /// </summary>
    [Required(ErrorMessage = "Date is required")]
    public DateTime Date { get; set; }
}
