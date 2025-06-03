using Api.Data;
using Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Api.Services;

/// <summary>
/// Service for seeding initial data into the database
/// </summary>
public interface IDataSeedService
{
    Task SeedAsync();
    Task SeedReferenceDataAsync();
    Task SeedStockDataFromCsvAsync(string filePath);
}

public class DataSeedService : IDataSeedService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<DataSeedService> _logger;

    public DataSeedService(FinanceDbContext context, ILogger<DataSeedService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Seed all initial data
    /// </summary>
    public async Task SeedAsync()
    {
        _logger.LogInformation("Starting data seeding process...");
        
        try
        {
            // Ensure database is created
            await _context.Database.EnsureCreatedAsync();
            
            // Seed reference data first
            await SeedReferenceDataAsync();
            
            // Seed AAPL stock data from CSV
            var csvPath = Path.Combine("ExampleData", "aapl.us.txt");
            if (File.Exists(csvPath))
            {
                await SeedStockDataFromCsvAsync(csvPath);
            }
            else
            {
                _logger.LogWarning("AAPL CSV file not found at {Path}", csvPath);
            }
            
            _logger.LogInformation("Data seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during data seeding");
            throw;
        }
    }

    /// <summary>
    /// Seed reference data (Sectors and Exchanges)
    /// </summary>
    public async Task SeedReferenceDataAsync()
    {
        _logger.LogInformation("Seeding reference data...");

        // Seed Exchanges
        if (!await _context.Exchanges.AnyAsync())
        {
            var exchanges = new List<Exchange>
            {
                new() { Name = "NASDAQ", Code = "NASDAQ", Country = "United States", Timezone = "America/New_York" },
                new() { Name = "New York Stock Exchange", Code = "NYSE", Country = "United States", Timezone = "America/New_York" },
                new() { Name = "NYSE American", Code = "AMEX", Country = "United States", Timezone = "America/New_York" },
                new() { Name = "Over-The-Counter", Code = "OTC", Country = "United States", Timezone = "America/New_York" }
            };

            _context.Exchanges.AddRange(exchanges);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Seeded {Count} exchanges", exchanges.Count);
        }

        // Seed Sectors
        if (!await _context.Sectors.AnyAsync())
        {
            var sectors = new List<Sector>
            {
                new() { Name = "Technology", Description = "Companies involved in the research, development, and distribution of technologically based goods and services" },
                new() { Name = "Healthcare", Description = "Companies that provide medical services, manufacture medical equipment, or drugs" },
                new() { Name = "Financial Services", Description = "Companies that provide financial services to commercial and retail customers" },
                new() { Name = "Consumer Discretionary", Description = "Companies that sell non-essential goods and services" },
                new() { Name = "Consumer Staples", Description = "Companies that sell essential goods and services" },
                new() { Name = "Energy", Description = "Companies involved in the exploration, production, and distribution of energy" },
                new() { Name = "Industrials", Description = "Companies involved in aerospace, defense, machinery, and industrial products" },
                new() { Name = "Materials", Description = "Companies involved in the discovery, development, and processing of raw materials" },
                new() { Name = "Real Estate", Description = "Companies that own, operate, or finance income-generating real estate" },
                new() { Name = "Utilities", Description = "Companies that provide essential services such as electricity, gas, and water" },
                new() { Name = "Communication Services", Description = "Companies that facilitate communication and offer related content and information" }
            };

            _context.Sectors.AddRange(sectors);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Seeded {Count} sectors", sectors.Count);
        }
    }

    /// <summary>
    /// Seed stock data from CSV file
    /// </summary>
    public async Task SeedStockDataFromCsvAsync(string filePath)
    {
        _logger.LogInformation("Seeding stock data from CSV: {FilePath}", filePath);

        if (!File.Exists(filePath))
        {
            _logger.LogWarning("CSV file not found: {FilePath}", filePath);
            return;
        }

        try
        {
            // Check if AAPL stock already exists
            var existingStock = await _context.Stocks.FirstOrDefaultAsync(s => s.Symbol == "AAPL");
            if (existingStock != null)
            {
                _logger.LogInformation("AAPL stock already exists in database");
                return;
            }

            // Get required reference data
            var technologySector = await _context.Sectors.FirstOrDefaultAsync(s => s.Name == "Technology");
            var nasdaqExchange = await _context.Exchanges.FirstOrDefaultAsync(e => e.Code == "NASDAQ");

            if (technologySector == null || nasdaqExchange == null)
            {
                _logger.LogError("Required reference data not found. Technology sector or NASDAQ exchange missing.");
                return;
            }

            // Create AAPL stock
            var appleStock = new Stock
            {
                Symbol = "AAPL",
                Name = "Apple Inc.",
                Description = "Apple Inc. designs, manufactures, and markets consumer electronics, computer software, and online services.",
                SectorId = technologySector.Id,
                ExchangeId = nasdaqExchange.Id,
                IsActive = true
            };

            _context.Stocks.Add(appleStock);
            await _context.SaveChangesAsync();

            // Read and parse CSV data
            var stockPrices = new List<StockPrice>();
            var lines = await File.ReadAllLinesAsync(filePath);
            var headerSkipped = false;

            foreach (var line in lines)
            {
                if (!headerSkipped)
                {
                    headerSkipped = true;
                    continue; // Skip header
                }

                if (string.IsNullOrWhiteSpace(line)) continue;

                var parts = line.Split(',');
                if (parts.Length < 7) continue;

                try
                {
                    var stockPrice = new StockPrice
                    {
                        StockId = appleStock.Id,
                        Date = DateTime.ParseExact(parts[0], "yyyy-MM-dd", CultureInfo.InvariantCulture),
                        Open = decimal.Parse(parts[1], CultureInfo.InvariantCulture),
                        High = decimal.Parse(parts[2], CultureInfo.InvariantCulture),
                        Low = decimal.Parse(parts[3], CultureInfo.InvariantCulture),
                        Close = decimal.Parse(parts[4], CultureInfo.InvariantCulture),
                        Volume = long.Parse(parts[5], CultureInfo.InvariantCulture),
                        AdjustedClose = parts.Length > 6 ? decimal.Parse(parts[6], CultureInfo.InvariantCulture) : null
                    };

                    stockPrices.Add(stockPrice);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to parse line: {Line}. Error: {Error}", line, ex.Message);
                }
            }

            // Batch insert stock prices for better performance
            const int batchSize = 1000;
            for (int i = 0; i < stockPrices.Count; i += batchSize)
            {
                var batch = stockPrices.Skip(i).Take(batchSize).ToList();
                _context.StockPrices.AddRange(batch);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Processed batch {BatchNumber} - {Count} records", 
                    (i / batchSize) + 1, batch.Count);
            }

            // Update stock market cap (approximate calculation)
            if (stockPrices.Any())
            {
                var latestPrice = stockPrices.OrderByDescending(p => p.Date).First();
                appleStock.MarketCap = latestPrice.Close * 15_000_000_000; // Approximate shares outstanding
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Successfully seeded {Count} stock price records for AAPL", stockPrices.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding stock data from CSV: {FilePath}", filePath);
            throw;
        }
    }
}
