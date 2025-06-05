namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for Sector information
/// </summary>
public class SectorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Aggregated information
    public int StockCount { get; set; }
}
