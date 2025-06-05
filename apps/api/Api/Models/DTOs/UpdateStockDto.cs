using System.ComponentModel.DataAnnotations;

namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for updating an existing stock
/// </summary>
public class UpdateStockDto
{
    /// <summary>
    /// Company name
    /// </summary>
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 200 characters")]
    public string? Name { get; set; }

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
    public bool? IsActive { get; set; }

    /// <summary>
    /// Sector ID
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Sector ID must be positive")]
    public int? SectorId { get; set; }

    /// <summary>
    /// Exchange ID
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Exchange ID must be positive")]
    public int? ExchangeId { get; set; }
}
