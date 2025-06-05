using Api.Models.DTOs;

namespace Api.Services;

/// <summary>
/// Service interface for sector operations
/// </summary>
public interface ISectorService
{
    Task<IEnumerable<SectorDto>> GetSectorsAsync();
    Task<IEnumerable<StockDto>> GetStocksBySectorAsync(int sectorId);
}

/// <summary>
/// Service interface for exchange operations
/// </summary>
public interface IExchangeService
{
    Task<IEnumerable<ExchangeDto>> GetExchangesAsync();
    Task<IEnumerable<StockDto>> GetStocksByExchangeAsync(int exchangeId);
}
