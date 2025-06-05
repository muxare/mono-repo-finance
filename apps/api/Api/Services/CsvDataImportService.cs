using Api.Data;
using Api.Models.Entities;
using Api.Models.Import;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Globalization;

namespace Api.Services;

/// <summary>
/// CSV-specific data import service implementation
/// </summary>
public class CsvDataImportService : IDataImportService
{    private readonly FinanceDbContext _context;
    private readonly IDataValidationService _validationService;
    private readonly IBackupService _backupService;
    private readonly ILogger<CsvDataImportService> _logger;
    private readonly ConcurrentDictionary<Guid, ImportProgress> _importProgress = new();
    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _cancellationTokens = new();

    public CsvDataImportService(
        FinanceDbContext context,
        IDataValidationService validationService,
        IBackupService backupService,
        ILogger<CsvDataImportService> logger)
    {
        _context = context;
        _validationService = validationService;
        _backupService = backupService;
        _logger = logger;
    }

    /// <summary>
    /// Import data from CSV stream
    /// </summary>
    public async Task<ImportResult> ImportCsvAsync(Stream csvStream, string fileName, ImportOptions options)
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
            CurrentOperation = "Reading CSV file"
        };

        _importProgress[importId] = progress;
        var cancellationTokenSource = new CancellationTokenSource();
        _cancellationTokens[importId] = cancellationTokenSource;

        try
        {
            _logger.LogInformation("Starting CSV import for file: {FileName}, ImportId: {ImportId}", fileName, importId);

            // Create backup if requested
            if (options.CreateBackup && !options.ValidateOnly)
            {
                _logger.LogInformation("Creating database backup before import");
                progress.CurrentOperation = "Creating backup";
                
                try
                {
                    var backupFilePath = await _backupService.CreateBackupAsync($"pre_import_{fileName.Replace(".", "_")}");
                    _logger.LogInformation("Backup created successfully: {BackupFilePath}", backupFilePath);
                }
                catch (Exception backupEx)
                {
                    _logger.LogWarning(backupEx, "Failed to create backup, continuing with import");
                    // Don't fail the import if backup fails
                }
            }

            progress.CurrentOperation = "Reading CSV file";

            // Parse CSV data
            var records = await ParseCsvAsync(csvStream, options, progress, cancellationTokenSource.Token);
            
            if (cancellationTokenSource.Token.IsCancellationRequested)
            {
                result.Status = ImportStatus.Cancelled;
                result.Message = "Import cancelled by user";
                progress.Status = ImportStatus.Cancelled;
                return result;
            }

            progress.TotalRecords = records.Count;
            progress.CurrentOperation = "Validating data";

            // Validate data
            var validationResult = _validationService.ValidatePriceRecords(records);
            result.Errors.AddRange(validationResult.Errors);

            if (!validationResult.IsValid && !options.ValidateOnly)
            {
                result.Status = ImportStatus.Failed;
                result.Message = $"Validation failed with {validationResult.Errors.Count} errors";
                progress.Status = ImportStatus.Failed;
                _logger.LogWarning("Import validation failed for {ImportId}: {ErrorCount} errors", importId, validationResult.Errors.Count);
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

            _logger.LogInformation("CSV import completed for {ImportId}: {SuccessfulRecords} successful, {FailedRecords} failed", 
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
    }

    /// <summary>
    /// Import data from CSV file
    /// </summary>
    public async Task<ImportResult> ImportCsvFileAsync(string filePath, ImportOptions options)
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
        return await ImportCsvAsync(fileStream, Path.GetFileName(filePath), options);
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
    /// Get import history (placeholder - would typically use database)
    /// </summary>
    public async Task<IEnumerable<ImportResult>> GetImportHistoryAsync(int skip = 0, int take = 20)
    {
        // In a real implementation, this would query the database
        // For now, return empty list
        return Enumerable.Empty<ImportResult>();
    }

    /// <summary>
    /// Parse CSV data from stream
    /// </summary>
    private async Task<List<CsvPriceRecord>> ParseCsvAsync(Stream csvStream, ImportOptions options, ImportProgress progress, CancellationToken cancellationToken)
    {
        var records = new List<CsvPriceRecord>();

        using var reader = new StreamReader(csvStream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            PrepareHeaderForMatch = args => args.Header.ToLower()
        });

        // Map CSV columns to our model
        csv.Context.RegisterClassMap<CsvPriceRecordMap>();

        var lineNumber = 1;
        await foreach (var record in csv.GetRecordsAsync<CsvPriceRecord>())
        {
            cancellationToken.ThrowIfCancellationRequested();
            
            lineNumber++;
            records.Add(record);

            // Update progress every 1000 records
            if (lineNumber % 1000 == 0)
            {
                progress.ProcessedRecords = lineNumber;
                _logger.LogDebug("Parsed {RecordCount} records for import {ImportId}", lineNumber, progress.ImportId);
            }
        }

        progress.ProcessedRecords = lineNumber;
        _logger.LogInformation("Parsed {TotalRecords} records from CSV for import {ImportId}", records.Count, progress.ImportId);

        return records;
    }

    /// <summary>
    /// Import records to database
    /// </summary>
    private async Task ImportToDatabase(List<CsvPriceRecord> records, ImportOptions options, ImportResult result, ImportProgress progress, CancellationToken cancellationToken)
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
    private async Task ProcessBatch(List<CsvPriceRecord> batch, Stock stock, ImportOptions options, ImportResult result, CancellationToken cancellationToken)
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

    /// <summary>
    /// JSON import methods - not supported by CSV service
    /// </summary>
    public Task<ImportResult> ImportJsonAsync(Stream jsonStream, string fileName, ImportOptions options)
    {
        throw new NotSupportedException("JSON import is not supported by CSV service. Use JsonDataImportService instead.");
    }

    public Task<ImportResult> ImportJsonFileAsync(string filePath, ImportOptions options)
    {
        throw new NotSupportedException("JSON import is not supported by CSV service. Use JsonDataImportService instead.");
    }
}

/// <summary>
/// CSV mapping configuration for price records
/// </summary>
public class CsvPriceRecordMap : ClassMap<CsvPriceRecord>
{
    public CsvPriceRecordMap()
    {
        Map(m => m.Date).Name("Date");
        Map(m => m.Open).Name("Open");
        Map(m => m.High).Name("High");
        Map(m => m.Low).Name("Low");
        Map(m => m.Close).Name("Close");
        Map(m => m.Volume).Name("Volume");
        Map(m => m.OpenInt).Name("OpenInt").Optional();
    }
}
