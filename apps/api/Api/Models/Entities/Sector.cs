namespace Api.Models.Entities;

/// <summary>
/// Represents a business sector classification
/// </summary>
public class Sector
{
    public int Id { get; set; }
    
    /// <summary>
    /// Sector name (e.g., "Technology", "Healthcare", "Financial Services")
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Detailed description of the sector
    /// </summary>
    public string? Description { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation Properties
    public ICollection<Stock> Stocks { get; set; } = new List<Stock>();
}
