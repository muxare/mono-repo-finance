using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Service interface for stock price operations
/// </summary>
public interface IStockPriceService
{
    Task<IEnumerable<StockPriceDto>> GetStockPricesAsync(string symbol, PriceRangeRequest request);
    Task<StockPriceDto?> GetLatestStockPriceAsync(string symbol);
    
    // Admin operations
    Task<StockPriceDto> CreateStockPriceAsync(CreateStockPriceDto createStockPriceDto);
    Task<IEnumerable<StockPriceDto>> CreateBulkStockPricesAsync(IEnumerable<CreateStockPriceDto> createStockPriceDtos);
    Task<bool> DeleteStockPricesAsync(string symbol, DateTime? fromDate = null, DateTime? toDate = null);
}
