using System.ComponentModel.DataAnnotations;

namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for creating a new stock
/// </summary>
public class CreateStockDto
{
    /// <summary>
    /// Stock symbol (e.g., AAPL, MSFT)
    /// </summary>
    [Required(ErrorMessage = "Symbol is required")]
    [StringLength(10, MinimumLength = 1, ErrorMessage = "Symbol must be between 1 and 10 characters")]
    [RegularExpression(@"^[A-Z0-9.-]+$", ErrorMessage = "Symbol must contain only uppercase letters, numbers, dots, and hyphens")]
    public string Symbol { get; set; } = string.Empty;

    /// <summary>
    /// Company name
    /// </summary>
    [Required(ErrorMessage = "Name is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 200 characters")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Market capitalization in USD
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "Market cap must be non-negative")]
    public decimal? MarketCap { get; set; }

    /// <summary>
    /// Company description
    /// </summary>
    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    /// <summary>
    /// Number of outstanding shares
    /// </summary>
    [Range(1, long.MaxValue, ErrorMessage = "Outstanding shares must be positive")]
    public long? OutstandingShares { get; set; }

    /// <summary>
    /// Whether the stock is actively traded
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Sector ID
    /// </summary>
    [Required(ErrorMessage = "Sector ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Sector ID must be positive")]
    public int SectorId { get; set; }

    /// <summary>
    /// Exchange ID
    /// </summary>
    [Required(ErrorMessage = "Exchange ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Exchange ID must be positive")]
    public int ExchangeId { get; set; }
}
