using Api.Data;
using Api.Models.Entities;
using Api.Models.Import;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Api.Services;

/// <summary>
/// JSON import data model
/// </summary>
public class JsonStockData
{
    public string Symbol { get; set; } = string.Empty;
    public List<JsonPriceRecord> Data { get; set; } = new();
}

/// <summary>
/// JSON price record model
/// </summary>
public class JsonPriceRecord
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
}

/// <summary>
/// JSON-specific data import service implementation
/// </summary>
public class JsonDataImportService : IJsonDataImportService
{
    private readonly FinanceDbContext _context;
    private readonly IDataValidationService _validationService;
    private readonly ILogger<JsonDataImportService> _logger;
    private readonly ConcurrentDictionary<Guid, ImportProgress> _importProgress = new();
    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _cancellationTokens = new();

    public JsonDataImportService(
        FinanceDbContext context,
        IDataValidationService validationService,
        ILogger<JsonDataImportService> logger)
    {
        _context = context;
        _validationService = validationService;
        _logger = logger;
    }

    /// <summary>
    /// Import data from JSON stream
    /// </summary>
    public async Task<ImportResult> ImportCsvAsync(Stream csvStream, string fileName, ImportOptions options)
    {
        // This method name is from interface but we'll treat it as JSON
        return await ImportJsonAsync(csvStream, fileName, options);
    }

    /// <summary>
    /// Import data from JSON stream
    /// </summary>
    public async Task<ImportResult> ImportJsonAsync(Stream jsonStream, string fileName, ImportOptions options)
    {
        var importId = Guid.NewGuid();
        var result = new ImportResult
        {
            ImportId = importId,
            Status = ImportStatus.InProgress,
            StartTime = DateTime.UtcNow
        };

        var progress = new ImportProgress
        {
            ImportId = importId,
            Status = ImportStatus.InProgress,
            StartTime = DateTime.UtcNow,
            CurrentOperation = "Reading JSON file"
        };

        _importProgress[importId] = progress;
        var cancellationTokenSource = new CancellationTokenSource();
        _cancellationTokens[importId] = cancellationTokenSource;

        try
        {
            _logger.LogInformation("Starting JSON import for file: {FileName}, ImportId: {ImportId}", fileName, importId);

            // Parse JSON data
            var records = await ParseJsonAsync(jsonStream, options, progress, cancellationTokenSource.Token);
            
            if (cancellationTokenSource.Token.IsCancellationRequested)
            {
                result.Status = ImportStatus.Cancelled;
                result.Message = "Import cancelled by user";
                progress.Status = ImportStatus.Cancelled;
                return result;
            }

            progress.TotalRecords = records.Count;
            progress.CurrentOperation = "Validating data";

            // Convert JSON records to CSV records for validation
            var csvRecords = records.Select(r => new CsvPriceRecord
            {
                Date = r.Date,
                Open = r.Open,
                High = r.High,
                Low = r.Low,
                Close = r.Close,
                Volume = r.Volume
            }).ToList();

            // Validate data
            var validationResult = _validationService.ValidatePriceRecords(csvRecords);
            result.Errors.AddRange(validationResult.Errors);

            if (!validationResult.IsValid && !options.ValidateOnly)
            {
                result.Status = ImportStatus.Failed;
                result.Message = $"Validation failed with {validationResult.Errors.Count} errors";
                progress.Status = ImportStatus.Failed;
                _logger.LogWarning("JSON import validation failed for {ImportId}: {ErrorCount} errors", importId, validationResult.Errors.Count);
                return result;
            }

            if (options.ValidateOnly)
            {
                result.Status = validationResult.IsValid ? ImportStatus.Completed : ImportStatus.Failed;
                result.Message = validationResult.IsValid ? "Validation successful" : "Validation failed";
                result.ProcessedRecords = records.Count;
                progress.Status = result.Status;
                progress.ProcessedRecords = records.Count;
                return result;
            }

            progress.CurrentOperation = "Importing to database";

            // Import to database
            await ImportToDatabase(records, options, result, progress, cancellationTokenSource.Token);

            result.Status = ImportStatus.Completed;
            result.EndTime = DateTime.UtcNow;
            result.Message = $"Successfully imported {result.SuccessfulRecords} records";
            progress.Status = ImportStatus.Completed;

            _logger.LogInformation("JSON import completed for {ImportId}: {SuccessfulRecords} successful, {FailedRecords} failed", 
                importId, result.SuccessfulRecords, result.FailedRecords);
        }
        catch (OperationCanceledException)
        {
            result.Status = ImportStatus.Cancelled;
            result.Message = "Import cancelled";
            progress.Status = ImportStatus.Cancelled;
            _logger.LogInformation("Import cancelled for {ImportId}", importId);
        }
        catch (Exception ex)
        {
            result.Status = ImportStatus.Failed;
            result.Message = ex.Message;
            progress.Status = ImportStatus.Failed;
            _logger.LogError(ex, "Import failed for {ImportId}", importId);
        }
        finally
        {
            _cancellationTokens.TryRemove(importId, out _);
            // Keep progress for a while for status checking
            _ = Task.Delay(TimeSpan.FromHours(1)).ContinueWith(t => _importProgress.TryRemove(importId, out _));
        }

        return result;
    }    /// <summary>
    /// Import data from JSON file
    /// </summary>
    public async Task<ImportResult> ImportJsonFileAsync(string filePath, ImportOptions options)
    {
        if (!File.Exists(filePath))
        {
            return new ImportResult
            {
                ImportId = Guid.NewGuid(),
                Status = ImportStatus.Failed,
                Message = $"File not found: {filePath}",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow
            };
        }

        using var fileStream = File.OpenRead(filePath);
        return await ImportJsonAsync(fileStream, Path.GetFileName(filePath), options);
    }

    /// <summary>
    /// Cancel an ongoing import operation
    /// </summary>
    public async Task<bool> CancelImportAsync(Guid importId)
    {
        if (_cancellationTokens.TryGetValue(importId, out var cancellationTokenSource))
        {
            cancellationTokenSource.Cancel();
            _logger.LogInformation("Import cancellation requested for {ImportId}", importId);
            return true;
        }

        return false;
    }

    /// <summary>
    /// Get progress of an import operation
    /// </summary>
    public async Task<ImportProgress?> GetImportProgressAsync(Guid importId)
    {
        _importProgress.TryGetValue(importId, out var progress);
        return progress;
    }

    /// <summary>
    /// Get import history
    /// </summary>
    public async Task<IEnumerable<ImportResult>> GetImportHistoryAsync(int skip = 0, int take = 20)
    {
        // In a real implementation, this would query the database
        return Enumerable.Empty<ImportResult>();
    }

    /// <summary>
    /// Parse JSON data from stream
    /// </summary>
    private async Task<List<JsonPriceRecord>> ParseJsonAsync(Stream jsonStream, ImportOptions options, ImportProgress progress, CancellationToken cancellationToken)
    {
        var records = new List<JsonPriceRecord>();

        using var reader = new StreamReader(jsonStream);
        var jsonContent = await reader.ReadToEndAsync();

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        try
        {
            // Try to parse as single stock data object
            var stockData = JsonSerializer.Deserialize<JsonStockData>(jsonContent, jsonOptions);
            if (stockData?.Data != null)
            {
                records.AddRange(stockData.Data);
                options.Symbol = stockData.Symbol;
            }
        }
        catch
        {
            try
            {
                // Try to parse as array of price records
                var priceRecords = JsonSerializer.Deserialize<List<JsonPriceRecord>>(jsonContent, jsonOptions);
                if (priceRecords != null)
                {
                    records.AddRange(priceRecords);
                }
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException($"Invalid JSON format: {ex.Message}", ex);
            }
        }

        progress.ProcessedRecords = records.Count;
        _logger.LogInformation("Parsed {TotalRecords} records from JSON for import {ImportId}", records.Count, progress.ImportId);

        return records;
    }

    /// <summary>
    /// Import records to database
    /// </summary>
    private async Task ImportToDatabase(List<JsonPriceRecord> records, ImportOptions options, ImportResult result, ImportProgress progress, CancellationToken cancellationToken)
    {
        // Get or create stock
        var stock = await GetOrCreateStock(options.Symbol, cancellationToken);
        if (stock == null)
        {
            throw new InvalidOperationException($"Unable to find or create stock with symbol: {options.Symbol}");
        }

        var batchSize = options.BatchSize;
        var totalBatches = (int)Math.Ceiling((double)records.Count / batchSize);
        var processedCount = 0;

        for (int batchIndex = 0; batchIndex < totalBatches; batchIndex++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            
            var batch = records.Skip(batchIndex * batchSize).Take(batchSize).ToList();
            
            if (options.UseTransaction)
            {
                using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    await ProcessBatch(batch, stock, options, result, cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                }
                catch
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
            }
            else
            {
                await ProcessBatch(batch, stock, options, result, cancellationToken);
            }

            processedCount += batch.Count;
            progress.ProcessedRecords = processedCount;
            progress.SuccessfulRecords = result.SuccessfulRecords;
            progress.FailedRecords = result.FailedRecords;

            // Estimate completion time
            if (processedCount > 0)
            {
                var elapsed = DateTime.UtcNow - progress.StartTime;
                var estimatedTotal = elapsed.TotalMilliseconds * records.Count / processedCount;
                progress.EstimatedEndTime = progress.StartTime.AddMilliseconds(estimatedTotal);
            }

            _logger.LogDebug("Processed batch {BatchIndex}/{TotalBatches} for import {ImportId}", 
                batchIndex + 1, totalBatches, progress.ImportId);
        }

        result.ProcessedRecords = processedCount;
    }

    /// <summary>
    /// Process a batch of records
    /// </summary>
    private async Task ProcessBatch(List<JsonPriceRecord> batch, Stock stock, ImportOptions options, ImportResult result, CancellationToken cancellationToken)
    {
        var existingDates = new HashSet<DateTime>();
        
        if (options.SkipDuplicates)
        {
            var batchDates = batch.Select(r => r.Date).ToList();
            var existing = await _context.StockPrices
                .Where(sp => sp.StockId == stock.Id && batchDates.Contains(sp.Date))
                .Select(sp => sp.Date)
                .ToListAsync(cancellationToken);
            
            existingDates = existing.ToHashSet();
        }

        var stockPrices = new List<StockPrice>();

        foreach (var record in batch)
        {
            if (options.SkipDuplicates && existingDates.Contains(record.Date))
            {
                result.FailedRecords++;
                continue;
            }

            var stockPrice = new StockPrice
            {
                StockId = stock.Id,
                Date = record.Date,
                Open = record.Open,
                High = record.High,
                Low = record.Low,
                Close = record.Close,
                Volume = record.Volume
            };

            stockPrices.Add(stockPrice);
            result.SuccessfulRecords++;
        }

        if (stockPrices.Any())
        {
            _context.StockPrices.AddRange(stockPrices);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    /// <summary>
    /// Get or create stock entity
    /// </summary>
    private async Task<Stock?> GetOrCreateStock(string? symbol, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(symbol))
        {
            // For now, default to AAPL if no symbol provided
            symbol = "AAPL";
        }

        var stock = await _context.Stocks
            .FirstOrDefaultAsync(s => s.Symbol == symbol, cancellationToken);

        if (stock == null)
        {
            // Create a basic stock entry
            var defaultExchange = await _context.Exchanges
                .FirstOrDefaultAsync(e => e.Code == "NASDAQ", cancellationToken);
            
            var defaultSector = await _context.Sectors
                .FirstOrDefaultAsync(s => s.Name == "Technology", cancellationToken);

            if (defaultExchange != null && defaultSector != null)
            {
                stock = new Stock
                {
                    Symbol = symbol,
                    Name = $"{symbol} Corporation", // Placeholder name
                    ExchangeId = defaultExchange.Id,
                    SectorId = defaultSector.Id,
                    IsActive = true
                };

                _context.Stocks.Add(stock);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return stock;
    }
}
