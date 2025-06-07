using Api.Models.Import;

namespace Api.Services;

/// <summary>
/// Service for importing financial data from various sources
/// </summary>
public interface IDataImportService
{
    Task<ImportResult> ImportCsvAsync(Stream csvStream, string fileName, ImportOptions options);
    Task<ImportResult> ImportCsvFileAsync(string filePath, ImportOptions options);
    Task<ImportResult> ImportJsonAsync(Stream jsonStream, string fileName, ImportOptions options);
    Task<ImportResult> ImportJsonFileAsync(string filePath, ImportOptions options);
    Task<bool> CancelImportAsync(Guid importId);
    Task<ImportProgress?> GetImportProgressAsync(Guid importId);
    Task<IEnumerable<ImportResult>> GetImportHistoryAsync(int skip = 0, int take = 20);
    
    // Batch import methods
    Task<BatchImportResult> ImportBatchAsync(IFormFileCollection files, ImportOptions options, bool processInParallel = true, int maxConcurrency = 5);
    Task<bool> CancelBatchImportAsync(Guid batchId);
    Task<BatchImportProgress?> GetBatchImportProgressAsync(Guid batchId);
}
