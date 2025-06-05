using Api.Models.Import;

namespace Api.Services;

/// <summary>
/// Service for importing JSON financial data
/// </summary>
public interface IJsonDataImportService
{
    Task<ImportResult> ImportJsonAsync(Stream jsonStream, string fileName, ImportOptions options);
    Task<ImportResult> ImportJsonFileAsync(string filePath, ImportOptions options);
    Task<bool> CancelImportAsync(Guid importId);
    Task<ImportProgress?> GetImportProgressAsync(Guid importId);
    Task<IEnumerable<ImportResult>> GetImportHistoryAsync(int skip = 0, int take = 20);
}
