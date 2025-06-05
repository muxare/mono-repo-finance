using Api.Data;
using Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

/// <summary>
/// Service implementation for stock operations
/// </summary>
public class StockService : IStockService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<StockService> _logger;

    public StockService(FinanceDbContext context, ILogger<StockService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<StockSummaryDto>> GetStocksAsync(StockQueryParameters parameters)
    {
        try
        {
            var query = _context.Stocks
                .Include(s => s.Sector)
                .Include(s => s.Exchange)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(parameters.Search))
            {
                var searchTerm = parameters.Search.ToLower();
                query = query.Where(s => 
                    s.Symbol.ToLower().Contains(searchTerm) || 
                    s.Name.ToLower().Contains(searchTerm));
            }

            if (!string.IsNullOrEmpty(parameters.Sector))
            {
                query = query.Where(s => s.Sector.Name.ToLower() == parameters.Sector.ToLower());
            }

            if (!string.IsNullOrEmpty(parameters.Exchange))
            {
                query = query.Where(s => s.Exchange.Code.ToLower() == parameters.Exchange.ToLower());
            }

            if (parameters.IsActive.HasValue)
            {
                query = query.Where(s => s.IsActive == parameters.IsActive.Value);
            }

            // Apply sorting
            query = parameters.SortBy.ToLower() switch
            {
                "name" => parameters.SortOrder.ToLower() == "desc" 
                    ? query.OrderByDescending(s => s.Name)
                    : query.OrderBy(s => s.Name),
                "marketcap" => parameters.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.MarketCap)
                    : query.OrderBy(s => s.MarketCap),
                "updatedat" => parameters.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.UpdatedAt)
                    : query.OrderBy(s => s.UpdatedAt),
                _ => parameters.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.Symbol)
                    : query.OrderBy(s => s.Symbol)
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize);            var stocks = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .Select(s => new StockSummaryDto
                {
                    Id = s.Id,
                    Symbol = s.Symbol,
                    Name = s.Name,
                    MarketCap = s.MarketCap,
                    IsActive = s.IsActive,
                    SectorName = s.Sector.Name,
                    ExchangeCode = s.Exchange.Code
                })
                .ToListAsync();

            // Get latest prices for each stock (simplified approach)
            foreach (var stock in stocks)
            {
                var latestPrice = await _context.StockPrices
                    .Where(p => p.StockId == stock.Id)
                    .OrderByDescending(p => p.Date)
                    .FirstOrDefaultAsync();

                if (latestPrice != null)
                {
                    stock.LatestPrice = latestPrice.Close;
                    stock.LastPriceUpdate = latestPrice.Date;

                    // Calculate price change (compared to previous day)
                    var previousPrice = await _context.StockPrices
                        .Where(p => p.StockId == stock.Id && p.Date < latestPrice.Date)
                        .OrderByDescending(p => p.Date)
                        .FirstOrDefaultAsync();

                    if (previousPrice != null)
                    {
                        stock.PriceChange = latestPrice.Close - previousPrice.Close;
                        stock.ChangePercent = (stock.PriceChange / previousPrice.Close) * 100;
                    }
                }
            }

            return new PagedResult<StockSummaryDto>
            {
                Data = stocks,
                Page = parameters.Page,
                PageSize = parameters.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stocks with parameters: {@Parameters}", parameters);
            throw;
        }
    }

    public async Task<StockDto?> GetStockBySymbolAsync(string symbol)
    {
        try
        {
            var stock = await _context.Stocks
                .Include(s => s.Sector)
                .Include(s => s.Exchange)
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == symbol.ToLower());

            if (stock == null)
                return null;

            var stockDto = new StockDto
            {
                Id = stock.Id,
                Symbol = stock.Symbol,
                Name = stock.Name,
                MarketCap = stock.MarketCap,
                Description = stock.Description,
                OutstandingShares = stock.OutstandingShares,
                IsActive = stock.IsActive,
                CreatedAt = stock.CreatedAt,
                UpdatedAt = stock.UpdatedAt,
                Sector = new SectorDto
                {
                    Id = stock.Sector.Id,
                    Name = stock.Sector.Name,
                    Description = stock.Sector.Description,
                    CreatedAt = stock.Sector.CreatedAt,
                    UpdatedAt = stock.Sector.UpdatedAt
                },
                Exchange = new ExchangeDto
                {
                    Id = stock.Exchange.Id,
                    Name = stock.Exchange.Name,
                    Code = stock.Exchange.Code,
                    Country = stock.Exchange.Country,
                    Timezone = stock.Exchange.Timezone,
                    CreatedAt = stock.Exchange.CreatedAt,
                    UpdatedAt = stock.Exchange.UpdatedAt
                }
            };

            // Get latest price information
            var latestPrice = await _context.StockPrices
                .Where(p => p.StockId == stock.Id)
                .OrderByDescending(p => p.Date)
                .FirstOrDefaultAsync();

            if (latestPrice != null)
            {
                stockDto.LatestPrice = latestPrice.Close;
                stockDto.LastPriceUpdate = latestPrice.Date;

                // Calculate price change
                var previousPrice = await _context.StockPrices
                    .Where(p => p.StockId == stock.Id && p.Date < latestPrice.Date)
                    .OrderByDescending(p => p.Date)
                    .FirstOrDefaultAsync();

                if (previousPrice != null)
                {
                    stockDto.PriceChange = latestPrice.Close - previousPrice.Close;
                    stockDto.ChangePercent = (stockDto.PriceChange / previousPrice.Close) * 100;
                }
            }

            return stockDto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stock by symbol: {Symbol}", symbol);
            throw;
        }
    }

    public async Task<StockDto?> GetStockByIdAsync(int id)
    {
        try
        {
            var stock = await _context.Stocks
                .Include(s => s.Sector)
                .Include(s => s.Exchange)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (stock == null)
                return null;

            return new StockDto
            {
                Id = stock.Id,
                Symbol = stock.Symbol,
                Name = stock.Name,
                MarketCap = stock.MarketCap,
                Description = stock.Description,
                OutstandingShares = stock.OutstandingShares,
                IsActive = stock.IsActive,
                CreatedAt = stock.CreatedAt,
                UpdatedAt = stock.UpdatedAt,
                Sector = new SectorDto
                {
                    Id = stock.Sector.Id,
                    Name = stock.Sector.Name,
                    Description = stock.Sector.Description,
                    CreatedAt = stock.Sector.CreatedAt,
                    UpdatedAt = stock.Sector.UpdatedAt
                },
                Exchange = new ExchangeDto
                {
                    Id = stock.Exchange.Id,
                    Name = stock.Exchange.Name,
                    Code = stock.Exchange.Code,
                    Country = stock.Exchange.Country,
                    Timezone = stock.Exchange.Timezone,
                    CreatedAt = stock.Exchange.CreatedAt,
                    UpdatedAt = stock.Exchange.UpdatedAt
                }
            };
        }        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stock by ID: {StockId}", id);
            throw;
        }
    }

    public async Task<StockDto> CreateStockAsync(CreateStockDto createStockDto)
    {
        try
        {
            // Check if stock with symbol already exists
            var existingStock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == createStockDto.Symbol.ToLower());

            if (existingStock != null)
            {
                throw new InvalidOperationException($"Stock with symbol '{createStockDto.Symbol}' already exists");
            }

            // Validate sector exists
            var sector = await _context.Sectors.FindAsync(createStockDto.SectorId);
            if (sector == null)
            {
                throw new ArgumentException($"Sector with ID {createStockDto.SectorId} not found");
            }

            // Validate exchange exists
            var exchange = await _context.Exchanges.FindAsync(createStockDto.ExchangeId);
            if (exchange == null)
            {
                throw new ArgumentException($"Exchange with ID {createStockDto.ExchangeId} not found");
            }

            var stock = new Models.Entities.Stock
            {
                Symbol = createStockDto.Symbol.ToUpper(),
                Name = createStockDto.Name,
                MarketCap = createStockDto.MarketCap,
                Description = createStockDto.Description,
                OutstandingShares = createStockDto.OutstandingShares,
                IsActive = createStockDto.IsActive,
                SectorId = createStockDto.SectorId,
                ExchangeId = createStockDto.ExchangeId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Stocks.Add(stock);
            await _context.SaveChangesAsync();

            // Reload with related data
            await _context.Entry(stock)
                .Reference(s => s.Sector)
                .LoadAsync();
            await _context.Entry(stock)
                .Reference(s => s.Exchange)
                .LoadAsync();

            return new StockDto
            {
                Id = stock.Id,
                Symbol = stock.Symbol,
                Name = stock.Name,
                MarketCap = stock.MarketCap,
                Description = stock.Description,
                OutstandingShares = stock.OutstandingShares,
                IsActive = stock.IsActive,
                CreatedAt = stock.CreatedAt,
                UpdatedAt = stock.UpdatedAt,
                Sector = new SectorDto
                {
                    Id = stock.Sector.Id,
                    Name = stock.Sector.Name,
                    Description = stock.Sector.Description,
                    CreatedAt = stock.Sector.CreatedAt,
                    UpdatedAt = stock.Sector.UpdatedAt
                },
                Exchange = new ExchangeDto
                {
                    Id = stock.Exchange.Id,
                    Name = stock.Exchange.Name,
                    Code = stock.Exchange.Code,
                    Country = stock.Exchange.Country,
                    Timezone = stock.Exchange.Timezone,
                    CreatedAt = stock.Exchange.CreatedAt,
                    UpdatedAt = stock.Exchange.UpdatedAt
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating stock: {Symbol}", createStockDto.Symbol);
            throw;
        }
    }

    public async Task<StockDto?> UpdateStockAsync(string symbol, UpdateStockDto updateStockDto)
    {
        try
        {
            var stock = await _context.Stocks
                .Include(s => s.Sector)
                .Include(s => s.Exchange)
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == symbol.ToLower());

            if (stock == null)
                return null;

            // Update only provided fields
            if (!string.IsNullOrEmpty(updateStockDto.Name))
                stock.Name = updateStockDto.Name;

            if (updateStockDto.MarketCap.HasValue)
                stock.MarketCap = updateStockDto.MarketCap.Value;

            if (updateStockDto.Description != null)
                stock.Description = updateStockDto.Description;

            if (updateStockDto.OutstandingShares.HasValue)
                stock.OutstandingShares = updateStockDto.OutstandingShares.Value;

            if (updateStockDto.IsActive.HasValue)
                stock.IsActive = updateStockDto.IsActive.Value;

            if (updateStockDto.SectorId.HasValue)
            {
                var sector = await _context.Sectors.FindAsync(updateStockDto.SectorId.Value);
                if (sector == null)
                {
                    throw new ArgumentException($"Sector with ID {updateStockDto.SectorId.Value} not found");
                }
                stock.SectorId = updateStockDto.SectorId.Value;
            }

            if (updateStockDto.ExchangeId.HasValue)
            {
                var exchange = await _context.Exchanges.FindAsync(updateStockDto.ExchangeId.Value);
                if (exchange == null)
                {
                    throw new ArgumentException($"Exchange with ID {updateStockDto.ExchangeId.Value} not found");
                }
                stock.ExchangeId = updateStockDto.ExchangeId.Value;
            }

            stock.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Reload related data if changed
            if (updateStockDto.SectorId.HasValue || updateStockDto.ExchangeId.HasValue)
            {
                await _context.Entry(stock)
                    .Reference(s => s.Sector)
                    .LoadAsync();
                await _context.Entry(stock)
                    .Reference(s => s.Exchange)
                    .LoadAsync();
            }

            return new StockDto
            {
                Id = stock.Id,
                Symbol = stock.Symbol,
                Name = stock.Name,
                MarketCap = stock.MarketCap,
                Description = stock.Description,
                OutstandingShares = stock.OutstandingShares,
                IsActive = stock.IsActive,
                CreatedAt = stock.CreatedAt,
                UpdatedAt = stock.UpdatedAt,
                Sector = new SectorDto
                {
                    Id = stock.Sector.Id,
                    Name = stock.Sector.Name,
                    Description = stock.Sector.Description,
                    CreatedAt = stock.Sector.CreatedAt,
                    UpdatedAt = stock.Sector.UpdatedAt
                },
                Exchange = new ExchangeDto
                {
                    Id = stock.Exchange.Id,
                    Name = stock.Exchange.Name,
                    Code = stock.Exchange.Code,
                    Country = stock.Exchange.Country,
                    Timezone = stock.Exchange.Timezone,
                    CreatedAt = stock.Exchange.CreatedAt,
                    UpdatedAt = stock.Exchange.UpdatedAt
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating stock: {Symbol}", symbol);
            throw;
        }
    }

    public async Task<bool> DeleteStockAsync(string symbol)
    {
        try
        {
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == symbol.ToLower());

            if (stock == null)
                return false;

            // Check if stock has price data
            var hasPriceData = await _context.StockPrices
                .AnyAsync(p => p.StockId == stock.Id);

            if (hasPriceData)
            {
                // Soft delete - just mark as inactive
                stock.IsActive = false;
                stock.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            else
            {
                // Hard delete if no price data
                _context.Stocks.Remove(stock);
                await _context.SaveChangesAsync();
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting stock: {Symbol}", symbol);
            throw;
        }
    }

    public async Task<bool> StockExistsAsync(string symbol)
    {
        try
        {
            return await _context.Stocks
                .AnyAsync(s => s.Symbol.ToLower() == symbol.ToLower());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while checking if stock exists: {Symbol}", symbol);
            throw;
        }
    }
}
