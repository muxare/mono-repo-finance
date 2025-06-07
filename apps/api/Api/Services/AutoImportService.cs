using Api.Data;
using Api.Models.Entities;
using Api.Models.Import;
using Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Api.Services;

/// <summary>
/// Service for auto-importing historical finance data from ExampleData folder
/// </summary>
public interface IAutoImportService
{
    Task<AutoImportResult> DiscoverAndImportAsync(AutoImportOptions options);
    Task<List<string>> GetAvailableFilesAsync();
    Task<List<string>> GetUnimportedFilesAsync();
}

public class AutoImportService : IAutoImportService
{
    private readonly FinanceDbContext _context;
    private readonly IDataImportService _importService;
    private readonly ILogger<AutoImportService> _logger;
    private readonly string _exampleDataPath;

    public AutoImportService(
        FinanceDbContext context,
        IDataImportService importService,
        ILogger<AutoImportService> logger)
    {
        _context = context;
        _importService = importService;
        _logger = logger;
        _exampleDataPath = Path.Combine(Directory.GetCurrentDirectory(), "ExampleData");
    }

    /// <summary>
    /// Discover unimported files and import them in batches
    /// </summary>
    public async Task<AutoImportResult> DiscoverAndImportAsync(AutoImportOptions options)
    {
        var result = new AutoImportResult
        {
            StartTime = DateTime.UtcNow,
            BatchSize = options.BatchSize
        };

        try
        {
            _logger.LogInformation("Starting auto-import process with batch size {BatchSize}", options.BatchSize);

            // Get list of unimported files
            var unimportedFiles = await GetUnimportedFilesAsync();
            
            if (!unimportedFiles.Any())
            {
                result.Status = AutoImportStatus.Completed;
                result.Message = "No new files to import";
                result.EndTime = DateTime.UtcNow;
                _logger.LogInformation("No new files found to import");
                return result;
            }

            // Take only the requested batch size
            var filesToImport = unimportedFiles.Take(options.BatchSize).ToList();
            result.TotalFilesDiscovered = unimportedFiles.Count;
            result.FilesToProcess = filesToImport.Count;

            _logger.LogInformation("Found {TotalFiles} unimported files, processing {BatchCount} in this batch", 
                result.TotalFilesDiscovered, result.FilesToProcess);

            // Process each file
            foreach (var fileName in filesToImport)
            {
                var fileResult = new AutoImportFileResult
                {
                    FileName = fileName,
                    StartTime = DateTime.UtcNow
                };

                try
                {
                    var filePath = Path.Combine(_exampleDataPath, fileName);
                    var symbol = ExtractSymbolFromFileName(fileName);

                    _logger.LogInformation("Processing file: {FileName} for symbol: {Symbol}", fileName, symbol);

                    // Check if stock already exists (shouldn't happen due to GetUnimportedFilesAsync, but double-check)
                    var existingStock = await _context.Stocks.FirstOrDefaultAsync(s => s.Symbol == symbol);
                    if (existingStock != null)
                    {
                        fileResult.Status = AutoImportFileStatus.Skipped;
                        fileResult.Message = $"Stock {symbol} already exists";
                        fileResult.EndTime = DateTime.UtcNow;
                        result.FileResults.Add(fileResult);
                        result.SkippedCount++;
                        continue;
                    }                    // Read and import the file
                    using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);                    var importOptions = new ImportOptions
                    {
                        Symbol = symbol,
                        ValidateOnly = false, // We want to actually import, not just validate
                        CreateBackup = options.CreateBackup,
                        SkipDuplicates = true,
                        BatchSize = 1000
                    };

                    var importResult = await _importService.ImportCsvAsync(fileStream, fileName, importOptions);                    if (importResult.Status == ImportStatus.Completed)
                    {
                        fileResult.Status = AutoImportFileStatus.Success;
                        fileResult.RecordsImported = importResult.ProcessedRecords;
                        fileResult.Message = $"Successfully imported {importResult.ProcessedRecords} records";
                        result.SuccessCount++;
                        result.TotalRecordsImported += importResult.ProcessedRecords;
                    }
                    else
                    {
                        fileResult.Status = AutoImportFileStatus.Failed;
                        fileResult.Message = $"Import failed: {importResult.Message}";
                        result.FailedCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing file {FileName}", fileName);
                    fileResult.Status = AutoImportFileStatus.Failed;
                    fileResult.Message = $"Exception: {ex.Message}";
                    result.FailedCount++;
                }

                fileResult.EndTime = DateTime.UtcNow;
                result.FileResults.Add(fileResult);
            }

            result.Status = result.FailedCount > 0 ? AutoImportStatus.CompletedWithErrors : AutoImportStatus.Completed;
            result.EndTime = DateTime.UtcNow;

            _logger.LogInformation("Auto-import completed. Success: {Success}, Failed: {Failed}, Skipped: {Skipped}", 
                result.SuccessCount, result.FailedCount, result.SkippedCount);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error during auto-import process");
            result.Status = AutoImportStatus.Failed;
            result.Message = $"Fatal error: {ex.Message}";
            result.EndTime = DateTime.UtcNow;
            return result;
        }
    }

    /// <summary>
    /// Get list of all available CSV files in ExampleData folder
    /// </summary>
    public async Task<List<string>> GetAvailableFilesAsync()
    {
        return await Task.Run(() =>
        {
            if (!Directory.Exists(_exampleDataPath))
            {
                _logger.LogWarning("ExampleData directory not found at {Path}", _exampleDataPath);
                return new List<string>();
            }            // Get all .txt files (these contain CSV data)
            var files = Directory.GetFiles(_exampleDataPath, "*.us.txt")
                .Select(Path.GetFileName)
                .Where(f => !string.IsNullOrEmpty(f))
                .Cast<string>()
                .ToList();

            _logger.LogInformation("Found {Count} available files in ExampleData folder", files.Count);
            return files;
        });
    }

    /// <summary>
    /// Get list of files that haven't been imported yet
    /// </summary>
    public async Task<List<string>> GetUnimportedFilesAsync()
    {
        var availableFiles = await GetAvailableFilesAsync();
        var importedSymbols = await _context.Stocks.Select(s => s.Symbol.ToUpper()).ToListAsync();

        var unimportedFiles = new List<string>();

        foreach (var fileName in availableFiles)
        {
            var symbol = ExtractSymbolFromFileName(fileName);
            if (!importedSymbols.Contains(symbol.ToUpper()))
            {
                unimportedFiles.Add(fileName);
            }
        }

        _logger.LogInformation("Found {Count} unimported files out of {Total} available files", 
            unimportedFiles.Count, availableFiles.Count);

        return unimportedFiles;
    }

    /// <summary>
    /// Extract stock symbol from filename (e.g., "aapl.us.txt" -> "AAPL")
    /// </summary>
    private static string ExtractSymbolFromFileName(string fileName)
    {
        // Files are in format: "symbol.us.txt"
        var nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName); // "aapl.us"
        var parts = nameWithoutExtension.Split('.');        return parts[0].ToUpper(); // "AAPL"
    }
}