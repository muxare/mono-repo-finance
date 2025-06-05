namespace Api.Models.DTOs;

/// <summary>
/// Data Transfer Object for Exchange information
/// </summary>
public class ExchangeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Aggregated information
    public int StockCount { get; set; }
}
