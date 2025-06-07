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
{    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly FinanceDbContext _context;
    private readonly IDataValidationService _validationService;
    private readonly IBackupService _backupService;
    private readonly ILogger<CsvDataImportService> _logger;
    private readonly ConcurrentDictionary<Guid, ImportProgress> _importProgress = new();
    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _cancellationTokens = new();

    public CsvDataImportService(
        IServiceScopeFactory serviceScopeFactory,
        FinanceDbContext context,
        IDataValidationService validationService,
        IBackupService backupService,
        ILogger<CsvDataImportService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
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
            }            if (options.ValidateOnly)
            {
                _logger.LogInformation("Validation-only mode: returning without importing to database");
                result.Status = validationResult.IsValid ? ImportStatus.Completed : ImportStatus.Failed;
                result.Message = validationResult.IsValid ? "Validation successful" : "Validation failed";
                result.ProcessedRecords = records.Count;
                progress.Status = result.Status;
                progress.ProcessedRecords = records.Count;
                return result;
            }

            _logger.LogInformation("Starting database import for {RecordCount} records", records.Count);
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
    }    /// <summary>
    /// Get or create stock entity
    /// </summary>
    private async Task<Stock?> GetOrCreateStock(string? symbol, CancellationToken cancellationToken)
    {
        _logger.LogInformation("GetOrCreateStock called with symbol: {Symbol}", symbol);
        
        if (string.IsNullOrEmpty(symbol))
        {
            _logger.LogWarning("Symbol is null or empty, defaulting to AAPL");
            // For now, default to AAPL if no symbol provided
            symbol = "AAPL";
        }

        var stock = await _context.Stocks
            .FirstOrDefaultAsync(s => s.Symbol == symbol, cancellationToken);

        if (stock == null)
        {
            _logger.LogInformation("Stock {Symbol} not found, creating new stock", symbol);
            
            // Create a basic stock entry
            var defaultExchange = await _context.Exchanges
                .FirstOrDefaultAsync(e => e.Code == "NASDAQ", cancellationToken);
            
            var defaultSector = await _context.Sectors
                .FirstOrDefaultAsync(s => s.Name == "Technology", cancellationToken);

            _logger.LogInformation("Found default exchange: {Exchange}, sector: {Sector}", 
                defaultExchange?.Code, defaultSector?.Name);

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
                _logger.LogInformation("Adding stock {Symbol} to context", symbol);
                
                try
                {
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Successfully saved stock {Symbol} with ID {StockId}", symbol, stock.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error saving stock {Symbol}", symbol);
                    throw;
                }
            }
            else
            {
                _logger.LogError("Could not find default exchange or sector. Exchange: {Exchange}, Sector: {Sector}", 
                    defaultExchange?.Code, defaultSector?.Name);
            }
        }
        else
        {
            _logger.LogInformation("Found existing stock {Symbol} with ID {StockId}", symbol, stock.Id);
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

    /// <summary>
    /// Import multiple files as a batch
    /// </summary>
    public async Task<BatchImportResult> ImportBatchAsync(IFormFileCollection files, ImportOptions options, bool processInParallel = true, int maxConcurrency = 5)
    {
        var batchId = Guid.NewGuid();
        var batchResult = new BatchImportResult
        {
            BatchId = batchId,
            OverallStatus = ImportStatus.InProgress,
            StartTime = DateTime.UtcNow,
            TotalFiles = files.Count
        };

        var batchProgress = new BatchImportProgress
        {
            BatchId = batchId,
            Status = ImportStatus.InProgress,
            StartTime = DateTime.UtcNow,
            TotalFiles = files.Count,
            CurrentOperation = "Starting batch import"
        };

        // Store batch progress (in a real implementation, this would be persisted)
        var batchProgressDict = new ConcurrentDictionary<Guid, BatchImportProgress>();
        batchProgressDict[batchId] = batchProgress;

        try
        {
            _logger.LogInformation("Starting batch import for {FileCount} files, BatchId: {BatchId}", files.Count, batchId);

            var fileResults = new ConcurrentBag<FileImportResult>();
            var semaphore = new SemaphoreSlim(maxConcurrency, maxConcurrency);

            var tasks = files.Select(async (file, index) =>
            {
                if (!processInParallel)
                {
                    await semaphore.WaitAsync();
                }

                try
                {
                    var fileResult = await ProcessSingleFileInBatch(file, index, options, batchProgress);
                    fileResults.Add(fileResult);

                    // Update batch progress
                    lock (batchProgress)
                    {
                        batchProgress.CompletedFiles++;
                        if (fileResult.ImportResult.Status == ImportStatus.Completed)
                            batchProgress.SuccessfulFiles++;
                        else if (fileResult.ImportResult.Status == ImportStatus.Failed)
                            batchProgress.FailedFiles++;
                    }

                    _logger.LogInformation("Completed file {FileIndex}/{TotalFiles}: {FileName} - Status: {Status}", 
                        index + 1, files.Count, file.FileName, fileResult.ImportResult.Status);
                }
                finally
                {
                    if (!processInParallel)
                    {
                        semaphore.Release();
                    }
                }
            });

            if (processInParallel)
            {
                await Task.WhenAll(tasks);
            }
            else
            {
                foreach (var task in tasks)
                {
                    await task;
                }
            }

            // Compile final results
            batchResult.FileResults = fileResults.OrderBy(fr => fr.FileIndex).ToList();
            batchResult.CompletedFiles = batchResult.FileResults.Count;
            batchResult.SuccessfulFiles = batchResult.FileResults.Count(fr => fr.ImportResult.Status == ImportStatus.Completed);
            batchResult.FailedFiles = batchResult.FileResults.Count(fr => fr.ImportResult.Status == ImportStatus.Failed);
            batchResult.EndTime = DateTime.UtcNow;

            // Calculate summary
            batchResult.Summary.TotalRecordsProcessed = batchResult.FileResults.Sum(fr => fr.ImportResult.ProcessedRecords);
            batchResult.Summary.TotalSuccessfulRecords = batchResult.FileResults.Sum(fr => fr.ImportResult.SuccessfulRecords);
            batchResult.Summary.TotalFailedRecords = batchResult.FileResults.Sum(fr => fr.ImportResult.FailedRecords);
            batchResult.Summary.TotalProcessingTime = batchResult.EndTime.Value - batchResult.StartTime;

            // Determine overall status
            if (batchResult.FailedFiles == 0)
            {
                batchResult.OverallStatus = ImportStatus.Completed;
                batchResult.Message = $"All {batchResult.TotalFiles} files imported successfully";
            }
            else if (batchResult.SuccessfulFiles == 0)
            {
                batchResult.OverallStatus = ImportStatus.Failed;
                batchResult.Message = $"All {batchResult.TotalFiles} files failed to import";
            }
            else
            {
                batchResult.OverallStatus = ImportStatus.Completed;
                batchResult.Message = $"{batchResult.SuccessfulFiles}/{batchResult.TotalFiles} files imported successfully";
            }

            _logger.LogInformation("Batch import completed. BatchId: {BatchId}, Status: {Status}, Files: {SuccessfulFiles}/{TotalFiles}", 
                batchId, batchResult.OverallStatus, batchResult.SuccessfulFiles, batchResult.TotalFiles);

            return batchResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Batch import failed. BatchId: {BatchId}", batchId);
            
            batchResult.OverallStatus = ImportStatus.Failed;
            batchResult.Message = $"Batch import failed: {ex.Message}";
            batchResult.EndTime = DateTime.UtcNow;
            
            return batchResult;
        }
    }

    /// <summary>
    /// Cancel a batch import operation
    /// </summary>
    public async Task<bool> CancelBatchImportAsync(Guid batchId)
    {
        // In a real implementation, this would cancel all ongoing imports in the batch
        _logger.LogInformation("Cancelling batch import: {BatchId}", batchId);
        
        // Cancel individual imports that are part of this batch
        // This would require tracking which imports belong to which batch
        
        return await Task.FromResult(true);
    }

    /// <summary>
    /// Get batch import progress
    /// </summary>
    public async Task<BatchImportProgress?> GetBatchImportProgressAsync(Guid batchId)
    {
        // In a real implementation, this would retrieve from persistent storage
        // For now, return null as we don't have persistent batch progress storage
        return await Task.FromResult<BatchImportProgress?>(null);
    }    /// <summary>
    /// Process a single file within a batch import
    /// </summary>
    private async Task<FileImportResult> ProcessSingleFileInBatch(IFormFile file, int fileIndex, ImportOptions options, BatchImportProgress batchProgress)
    {
        var fileResult = new FileImportResult
        {
            FileName = file.FileName,
            FileIndex = fileIndex,
            FileSizeBytes = file.Length,
            DetectedFormat = DetectFileFormat(file)
        };

        try
        {
            using var stream = file.OpenReadStream();
            
            // Route to appropriate import method based on detected format
            if (fileResult.DetectedFormat == "csv")
            {
                // Use a new scope to get a fresh DbContext for this file
                using var scope = _serviceScopeFactory.CreateScope();
                var scopedImportService = scope.ServiceProvider.GetRequiredService<IDataImportService>();
                
                // Ensure we're not using the current service (which would use the same DbContext)
                // Instead create a new CsvDataImportService with scoped services
                var scopedContext = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
                var scopedValidationService = scope.ServiceProvider.GetRequiredService<IDataValidationService>();
                var scopedBackupService = scope.ServiceProvider.GetRequiredService<IBackupService>();
                
                var scopedService = new CsvDataImportService(
                    _serviceScopeFactory,
                    scopedContext,
                    scopedValidationService,
                    scopedBackupService,
                    _logger);
                
                fileResult.ImportResult = await scopedService.ImportCsvAsync(stream, file.FileName, options);
            }
            else if (fileResult.DetectedFormat == "json")
            {
                // For now, return error since JSON import would need the JsonDataImportService
                fileResult.ImportResult = new ImportResult
                {
                    ImportId = Guid.NewGuid(),
                    Status = ImportStatus.Failed,
                    Message = "JSON import is not supported by CSV service",
                    StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow
                };
            }
            else
            {
                fileResult.ImportResult = new ImportResult
                {
                    ImportId = Guid.NewGuid(),
                    Status = ImportStatus.Failed,
                    Message = $"Unsupported file format: {fileResult.DetectedFormat}",
                    StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing file {FileName} in batch", file.FileName);
            
            fileResult.ImportResult = new ImportResult
            {
                ImportId = Guid.NewGuid(),
                Status = ImportStatus.Failed,
                Message = $"Error processing file: {ex.Message}",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow
            };
        }

        return fileResult;
    }

    /// <summary>
    /// Detect file format based on content and extension
    /// </summary>
    private string DetectFileFormat(IFormFile file)
    {
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        // Check extension first
        if (fileExtension == ".csv" || fileExtension == ".txt")
        {
            return "csv";
        }
        
        if (fileExtension == ".json")
        {
            return "json";
        }

        // If extension is unclear, peek at content
        try
        {
            using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            
            var firstLine = reader.ReadLine()?.Trim();
            
            if (string.IsNullOrEmpty(firstLine))
            {
                return "unknown";
            }

            // Check if it looks like JSON
            if (firstLine.StartsWith("{") || firstLine.StartsWith("["))
            {
                return "json";
            }

            // Check if it looks like CSV (contains commas)
            if (firstLine.Contains(','))
            {
                return "csv";
            }

            return "unknown";
        }
        catch
        {
            return "unknown";
        }
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
