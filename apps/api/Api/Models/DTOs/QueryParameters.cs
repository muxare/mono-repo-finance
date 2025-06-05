using System.ComponentModel.DataAnnotations;

namespace Api.Models.DTOs;

/// <summary>
/// Generic paginated result wrapper
/// </summary>
/// <typeparam name="T">Type of data being paginated</typeparam>
public class PagedResult<T>
{
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}

/// <summary>
/// Query parameters for stock listing
/// </summary>
public class StockQueryParameters
{
    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
    public int Page { get; set; } = 1;
    
    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    public int PageSize { get; set; } = 20;
    
    public string? Search { get; set; }
    public string? Sector { get; set; }
    public string? Exchange { get; set; }
    public bool? IsActive { get; set; }
    
    public string SortBy { get; set; } = "Symbol";
    public string SortOrder { get; set; } = "asc";
}

/// <summary>
/// Query parameters for stock price data
/// </summary>
public class PriceRangeRequest
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    
    [Range(1, 1000, ErrorMessage = "Limit must be between 1 and 1000")]
    public int Limit { get; set; } = 365;
    
    public bool IncludeAdjusted { get; set; } = false;
    public string SortOrder { get; set; } = "desc"; // Most recent first by default
}
