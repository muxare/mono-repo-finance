using Api.Data;
using Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

/// <summary>
/// Service implementation for sector operations
/// </summary>
public class SectorService : ISectorService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<SectorService> _logger;

    public SectorService(FinanceDbContext context, ILogger<SectorService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<SectorDto>> GetSectorsAsync()
    {
        try
        {
            var sectors = await _context.Sectors
                .Select(s => new SectorDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    StockCount = s.Stocks.Count
                })
                .OrderBy(s => s.Name)
                .ToListAsync();

            return sectors;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching sectors");
            throw;
        }
    }

    public async Task<IEnumerable<StockDto>> GetStocksBySectorAsync(int sectorId)
    {
        try
        {
            var stocks = await _context.Stocks
                .Include(s => s.Sector)
                .Include(s => s.Exchange)
                .Where(s => s.SectorId == sectorId)
                .Select(s => new StockDto
                {
                    Id = s.Id,
                    Symbol = s.Symbol,
                    Name = s.Name,
                    MarketCap = s.MarketCap,
                    Description = s.Description,
                    OutstandingShares = s.OutstandingShares,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    Sector = new SectorDto
                    {
                        Id = s.Sector.Id,
                        Name = s.Sector.Name,
                        Description = s.Sector.Description,
                        CreatedAt = s.Sector.CreatedAt,
                        UpdatedAt = s.Sector.UpdatedAt
                    },
                    Exchange = new ExchangeDto
                    {
                        Id = s.Exchange.Id,
                        Name = s.Exchange.Name,
                        Code = s.Exchange.Code,
                        Country = s.Exchange.Country,
                        Timezone = s.Exchange.Timezone,
                        CreatedAt = s.Exchange.CreatedAt,
                        UpdatedAt = s.Exchange.UpdatedAt
                    }
                })
                .OrderBy(s => s.Symbol)
                .ToListAsync();

            return stocks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stocks for sector: {SectorId}", sectorId);
            throw;
        }
    }
}

/// <summary>
/// Service implementation for exchange operations
/// </summary>
public class ExchangeService : IExchangeService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<ExchangeService> _logger;

    public ExchangeService(FinanceDbContext context, ILogger<ExchangeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ExchangeDto>> GetExchangesAsync()
    {
        try
        {
            var exchanges = await _context.Exchanges
                .Select(e => new ExchangeDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Code = e.Code,
                    Country = e.Country,
                    Timezone = e.Timezone,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
                    StockCount = e.Stocks.Count
                })
                .OrderBy(e => e.Name)
                .ToListAsync();

            return exchanges;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching exchanges");
            throw;
        }
    }

    public async Task<IEnumerable<StockDto>> GetStocksByExchangeAsync(int exchangeId)
    {
        try
        {
            var stocks = await _context.Stocks
                .Include(s => s.Sector)
                .Include(s => s.Exchange)
                .Where(s => s.ExchangeId == exchangeId)
                .Select(s => new StockDto
                {
                    Id = s.Id,
                    Symbol = s.Symbol,
                    Name = s.Name,
                    MarketCap = s.MarketCap,
                    Description = s.Description,
                    OutstandingShares = s.OutstandingShares,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    Sector = new SectorDto
                    {
                        Id = s.Sector.Id,
                        Name = s.Sector.Name,
                        Description = s.Sector.Description,
                        CreatedAt = s.Sector.CreatedAt,
                        UpdatedAt = s.Sector.UpdatedAt
                    },
                    Exchange = new ExchangeDto
                    {
                        Id = s.Exchange.Id,
                        Name = s.Exchange.Name,
                        Code = s.Exchange.Code,
                        Country = s.Exchange.Country,
                        Timezone = s.Exchange.Timezone,
                        CreatedAt = s.Exchange.CreatedAt,
                        UpdatedAt = s.Exchange.UpdatedAt
                    }
                })
                .OrderBy(s => s.Symbol)
                .ToListAsync();

            return stocks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stocks for exchange: {ExchangeId}", exchangeId);
            throw;
        }
    }
}
