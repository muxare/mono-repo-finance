using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Service interface for stock operations
/// </summary>
public interface IStockService
{
    Task<PagedResult<StockSummaryDto>> GetStocksAsync(StockQueryParameters parameters);
    Task<StockDto?> GetStockBySymbolAsync(string symbol);
    Task<StockDto?> GetStockByIdAsync(int id);
    
    // Admin operations
    Task<StockDto> CreateStockAsync(CreateStockDto createStockDto);
    Task<StockDto?> UpdateStockAsync(string symbol, UpdateStockDto updateStockDto);
    Task<bool> DeleteStockAsync(string symbol);
    Task<bool> StockExistsAsync(string symbol);
}
