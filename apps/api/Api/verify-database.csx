using Api.Data;
using Microsoft.EntityFrameworkCore;

var optionsBuilder = new DbContextOptionsBuilder<FinanceDbContext>();
optionsBuilder.UseSqlite("Data Source=FinanceScreener.db");

using var context = new FinanceDbContext(optionsBuilder.Options);

Console.WriteLine("=== Database Verification ===");

// Check Exchanges
var exchangeCount = await context.Exchanges.CountAsync();
Console.WriteLine($"Exchanges: {exchangeCount}");
if (exchangeCount > 0)
{
    var exchanges = await context.Exchanges.Take(5).ToListAsync();
    foreach (var exchange in exchanges)
    {
        Console.WriteLine($"  - {exchange.Code}: {exchange.Name}");
    }
}

// Check Sectors
var sectorCount = await context.Sectors.CountAsync();
Console.WriteLine($"Sectors: {sectorCount}");
if (sectorCount > 0)
{
    var sectors = await context.Sectors.Take(5).ToListAsync();
    foreach (var sector in sectors)
    {
        Console.WriteLine($"  - {sector.Name}");
    }
}

// Check Stocks
var stockCount = await context.Stocks.CountAsync();
Console.WriteLine($"Stocks: {stockCount}");
if (stockCount > 0)
{
    var stocks = await context.Stocks
        .Include(s => s.Exchange)
        .Include(s => s.Sector)
        .Take(5)
        .ToListAsync();
    foreach (var stock in stocks)
    {
        Console.WriteLine($"  - {stock.Symbol}: {stock.Name} ({stock.Exchange?.Code}) - {stock.Sector?.Name}");
    }
}

// Check StockPrices
var priceCount = await context.StockPrices.CountAsync();
Console.WriteLine($"Stock Prices: {priceCount}");
if (priceCount > 0)
{
    var prices = await context.StockPrices
        .Include(sp => sp.Stock)
        .OrderByDescending(sp => sp.Date)
        .Take(5)
        .ToListAsync();
    foreach (var price in prices)
    {
        Console.WriteLine($"  - {price.Stock?.Symbol} {price.Date:yyyy-MM-dd}: Close=${price.Close:F2}, Volume={price.Volume:N0}");
    }
}

// Check AAPL specifically
var aaplStock = await context.Stocks
    .Include(s => s.Exchange)
    .Include(s => s.Sector)
    .FirstOrDefaultAsync(s => s.Symbol == "AAPL");

if (aaplStock != null)
{
    Console.WriteLine("\n=== AAPL Stock Details ===");
    Console.WriteLine($"Symbol: {aaplStock.Symbol}");
    Console.WriteLine($"Name: {aaplStock.Name}");
    Console.WriteLine($"Exchange: {aaplStock.Exchange?.Name} ({aaplStock.Exchange?.Code})");
    Console.WriteLine($"Sector: {aaplStock.Sector?.Name}");
    Console.WriteLine($"Market Cap: {aaplStock.MarketCap:N0}");
    Console.WriteLine($"Outstanding Shares: {aaplStock.OutstandingShares:N0}");
    Console.WriteLine($"Created: {aaplStock.CreatedAt:yyyy-MM-dd HH:mm:ss}");
    
    var aaplPriceCount = await context.StockPrices
        .Where(sp => sp.StockId == aaplStock.Id)
        .CountAsync();
    Console.WriteLine($"AAPL Price Records: {aaplPriceCount}");
    
    if (aaplPriceCount > 0)
    {
        var latestPrice = await context.StockPrices
            .Where(sp => sp.StockId == aaplStock.Id)
            .OrderByDescending(sp => sp.Date)
            .FirstAsync();
        Console.WriteLine($"Latest Price: {latestPrice.Date:yyyy-MM-dd} - Close=${latestPrice.Close:F2}");
        
        var earliestPrice = await context.StockPrices
            .Where(sp => sp.StockId == aaplStock.Id)
            .OrderBy(sp => sp.Date)
            .FirstAsync();
        Console.WriteLine($"Earliest Price: {earliestPrice.Date:yyyy-MM-dd} - Close=${earliestPrice.Close:F2}");
    }
}
else
{
    Console.WriteLine("\n=== AAPL Stock Not Found ===");
}

Console.WriteLine("\n=== Verification Complete ===");
