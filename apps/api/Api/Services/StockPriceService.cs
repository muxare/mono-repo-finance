using Api.Data;
using Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

/// <summary>
/// Service implementation for stock price operations
/// </summary>
public class StockPriceService : IStockPriceService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<StockPriceService> _logger;

    public StockPriceService(FinanceDbContext context, ILogger<StockPriceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<StockPriceDto>> GetStockPricesAsync(string symbol, PriceRangeRequest request)
    {
        try
        {
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == symbol.ToLower());

            if (stock == null)
            {
                return Enumerable.Empty<StockPriceDto>();
            }

            var query = _context.StockPrices
                .Where(p => p.StockId == stock.Id);

            // Apply date filters
            if (request.From.HasValue)
            {
                query = query.Where(p => p.Date >= request.From.Value.Date);
            }

            if (request.To.HasValue)
            {
                query = query.Where(p => p.Date <= request.To.Value.Date);
            }

            // Apply sorting
            query = request.SortOrder.ToLower() == "asc"
                ? query.OrderBy(p => p.Date)
                : query.OrderByDescending(p => p.Date);

            // Apply limit
            query = query.Take(request.Limit);

            var prices = await query
                .Select(p => new StockPriceDto
                {
                    Id = p.Id,
                    Date = p.Date,
                    Open = p.Open,
                    High = p.High,
                    Low = p.Low,
                    Close = p.Close,
                    Volume = p.Volume,
                    AdjustedClose = p.AdjustedClose,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            // Calculate price changes
            for (int i = 0; i < prices.Count; i++)
            {
                if (i < prices.Count - 1) // Not the oldest price
                {
                    var currentPrice = prices[i];
                    var previousPrice = prices[i + 1]; // Previous day (when sorted desc)
                    
                    currentPrice.PriceChange = currentPrice.Close - previousPrice.Close;
                    currentPrice.ChangePercent = (currentPrice.PriceChange / previousPrice.Close) * 100;
                }
            }

            return prices;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stock prices for symbol: {Symbol}", symbol);
            throw;
        }
    }

    public async Task<StockPriceDto?> GetLatestStockPriceAsync(string symbol)
    {
        try
        {
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == symbol.ToLower());

            if (stock == null)
            {
                return null;
            }

            var latestPrice = await _context.StockPrices
                .Where(p => p.StockId == stock.Id)
                .OrderByDescending(p => p.Date)
                .FirstOrDefaultAsync();

            if (latestPrice == null)
            {
                return null;
            }

            var priceDto = new StockPriceDto
            {
                Id = latestPrice.Id,
                Date = latestPrice.Date,
                Open = latestPrice.Open,
                High = latestPrice.High,
                Low = latestPrice.Low,
                Close = latestPrice.Close,
                Volume = latestPrice.Volume,
                AdjustedClose = latestPrice.AdjustedClose,
                CreatedAt = latestPrice.CreatedAt
            };

            // Calculate change from previous day
            var previousPrice = await _context.StockPrices
                .Where(p => p.StockId == stock.Id && p.Date < latestPrice.Date)
                .OrderByDescending(p => p.Date)
                .FirstOrDefaultAsync();

            if (previousPrice != null)
            {
                priceDto.PriceChange = latestPrice.Close - previousPrice.Close;
                priceDto.ChangePercent = (priceDto.PriceChange / previousPrice.Close) * 100;
            }

            return priceDto;
        }        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching latest stock price for symbol: {Symbol}", symbol);
            throw;
        }
    }

    public async Task<StockPriceDto> CreateStockPriceAsync(CreateStockPriceDto createStockPriceDto)
    {
        try
        {
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == createStockPriceDto.Symbol.ToLower());

            if (stock == null)
            {
                throw new ArgumentException($"Stock with symbol '{createStockPriceDto.Symbol}' not found");
            }

            // Validate OHLC data
            if (createStockPriceDto.High < createStockPriceDto.Low)
            {
                throw new ArgumentException("High price cannot be lower than low price");
            }

            if (createStockPriceDto.Open < createStockPriceDto.Low || createStockPriceDto.Open > createStockPriceDto.High)
            {
                throw new ArgumentException("Open price must be between low and high prices");
            }

            if (createStockPriceDto.Close < createStockPriceDto.Low || createStockPriceDto.Close > createStockPriceDto.High)
            {
                throw new ArgumentException("Close price must be between low and high prices");
            }

            // Check if price already exists for this date
            var existingPrice = await _context.StockPrices
                .FirstOrDefaultAsync(p => p.StockId == stock.Id && p.Date.Date == createStockPriceDto.Date.Date);

            if (existingPrice != null)
            {
                throw new InvalidOperationException($"Price data already exists for {stock.Symbol} on {createStockPriceDto.Date:yyyy-MM-dd}");
            }

            var stockPrice = new Models.Entities.StockPrice
            {
                StockId = stock.Id,
                Date = createStockPriceDto.Date.Date,
                Open = createStockPriceDto.Open,
                High = createStockPriceDto.High,
                Low = createStockPriceDto.Low,
                Close = createStockPriceDto.Close,
                Volume = createStockPriceDto.Volume,
                AdjustedClose = createStockPriceDto.Close, // Default to close price
                CreatedAt = DateTime.UtcNow
            };

            _context.StockPrices.Add(stockPrice);
            await _context.SaveChangesAsync();

            return new StockPriceDto
            {
                Id = stockPrice.Id,
                Date = stockPrice.Date,
                Open = stockPrice.Open,
                High = stockPrice.High,
                Low = stockPrice.Low,
                Close = stockPrice.Close,
                Volume = stockPrice.Volume,
                AdjustedClose = stockPrice.AdjustedClose,
                CreatedAt = stockPrice.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating stock price for symbol: {Symbol}", createStockPriceDto.Symbol);
            throw;
        }
    }

    public async Task<IEnumerable<StockPriceDto>> CreateBulkStockPricesAsync(IEnumerable<CreateStockPriceDto> createStockPriceDtos)
    {
        try
        {
            var stockPricesDto = createStockPriceDtos.ToList();
            var createdPrices = new List<StockPriceDto>();

            // Group by symbol to optimize database queries
            var groupedBySymbol = stockPricesDto.GroupBy(p => p.Symbol.ToUpper());

            foreach (var symbolGroup in groupedBySymbol)
            {
                var symbol = symbolGroup.Key;
                var stock = await _context.Stocks
                    .FirstOrDefaultAsync(s => s.Symbol.ToLower() == symbol.ToLower());

                if (stock == null)
                {
                    _logger.LogWarning("Stock with symbol '{Symbol}' not found, skipping price data", symbol);
                    continue;
                }

                var stockPrices = new List<Models.Entities.StockPrice>();

                foreach (var priceDto in symbolGroup)
                {
                    // Validate OHLC data
                    if (priceDto.High < priceDto.Low ||
                        priceDto.Open < priceDto.Low || priceDto.Open > priceDto.High ||
                        priceDto.Close < priceDto.Low || priceDto.Close > priceDto.High)
                    {
                        _logger.LogWarning("Invalid OHLC data for {Symbol} on {Date}, skipping", symbol, priceDto.Date);
                        continue;
                    }

                    // Check if price already exists for this date
                    var existingPrice = await _context.StockPrices
                        .FirstOrDefaultAsync(p => p.StockId == stock.Id && p.Date.Date == priceDto.Date.Date);

                    if (existingPrice != null)
                    {
                        _logger.LogWarning("Price data already exists for {Symbol} on {Date}, skipping", symbol, priceDto.Date);
                        continue;
                    }

                    var stockPrice = new Models.Entities.StockPrice
                    {
                        StockId = stock.Id,
                        Date = priceDto.Date.Date,
                        Open = priceDto.Open,
                        High = priceDto.High,
                        Low = priceDto.Low,
                        Close = priceDto.Close,
                        Volume = priceDto.Volume,
                        AdjustedClose = priceDto.Close,
                        CreatedAt = DateTime.UtcNow
                    };

                    stockPrices.Add(stockPrice);
                }

                if (stockPrices.Any())
                {
                    _context.StockPrices.AddRange(stockPrices);
                    await _context.SaveChangesAsync();

                    createdPrices.AddRange(stockPrices.Select(sp => new StockPriceDto
                    {
                        Id = sp.Id,
                        Date = sp.Date,
                        Open = sp.Open,
                        High = sp.High,
                        Low = sp.Low,
                        Close = sp.Close,
                        Volume = sp.Volume,
                        AdjustedClose = sp.AdjustedClose,
                        CreatedAt = sp.CreatedAt
                    }));
                }
            }

            return createdPrices;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating bulk stock prices");
            throw;
        }
    }

    public async Task<bool> DeleteStockPricesAsync(string symbol, DateTime? fromDate = null, DateTime? toDate = null)
    {
        try
        {
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.Symbol.ToLower() == symbol.ToLower());

            if (stock == null)
                return false;

            var query = _context.StockPrices.Where(p => p.StockId == stock.Id);

            if (fromDate.HasValue)
            {
                query = query.Where(p => p.Date >= fromDate.Value.Date);
            }

            if (toDate.HasValue)
            {
                query = query.Where(p => p.Date <= toDate.Value.Date);
            }

            var pricesToDelete = await query.ToListAsync();

            if (pricesToDelete.Any())
            {
                _context.StockPrices.RemoveRange(pricesToDelete);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Deleted {Count} price records for symbol {Symbol}", pricesToDelete.Count, symbol);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting stock prices for symbol: {Symbol}", symbol);
            throw;
        }
    }
}
