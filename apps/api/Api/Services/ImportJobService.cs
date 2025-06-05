using Api.Models.Import;
using Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Hangfire;

namespace Api.Services;

/// <summary>
/// Background job service for handling long-running import operations
/// </summary>
public interface IImportJobService
{
    string ScheduleCsvImport(Stream csvStream, string fileName, ImportOptions options);
    string ScheduleCsvFileImport(string filePath, ImportOptions options);
}

public class ImportJobService : IImportJobService
{
    private readonly IDataImportService _importService;
    private readonly IHubContext<ImportProgressHub> _hubContext;
    private readonly ILogger<ImportJobService> _logger;

    public ImportJobService(
        IDataImportService importService,
        IHubContext<ImportProgressHub> hubContext,
        ILogger<ImportJobService> logger)
    {
        _importService = importService;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Schedule CSV import as background job
    /// </summary>
    public string ScheduleCsvImport(Stream csvStream, string fileName, ImportOptions options)
    {
        // Convert stream to byte array for serialization
        var memoryStream = new MemoryStream();
        csvStream.CopyTo(memoryStream);
        var fileData = memoryStream.ToArray();

        var jobId = BackgroundJob.Enqueue(() => ProcessCsvImportJob(fileData, fileName, options));
        
        _logger.LogInformation("Scheduled CSV import job {JobId} for file {FileName}", jobId, fileName);
        
        return jobId;
    }

    /// <summary>
    /// Schedule CSV file import as background job
    /// </summary>
    public string ScheduleCsvFileImport(string filePath, ImportOptions options)
    {
        var jobId = BackgroundJob.Enqueue(() => ProcessCsvFileImportJob(filePath, options));
        
        _logger.LogInformation("Scheduled CSV file import job {JobId} for file {FilePath}", jobId, filePath);
        
        return jobId;
    }

    /// <summary>
    /// Background job method for processing CSV import
    /// </summary>
    [Queue("imports")]
    public async Task ProcessCsvImportJob(byte[] fileData, string fileName, ImportOptions options)
    {
        _logger.LogInformation("Starting background CSV import job for file {FileName}", fileName);

        try
        {
            using var stream = new MemoryStream(fileData);
            var result = await _importService.ImportCsvAsync(stream, fileName, options);

            // Send completion notification via SignalR
            await _hubContext.Clients.Group($"import_{result.ImportId}")
                .SendAsync("ImportCompleted", result);

            _logger.LogInformation("Background CSV import job completed for file {FileName}. Status: {Status}, Records: {Records}", 
                fileName, result.Status, result.SuccessfulRecords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background CSV import job failed for file {FileName}", fileName);
            throw;
        }
    }

    /// <summary>
    /// Background job method for processing CSV file import
    /// </summary>
    [Queue("imports")]
    public async Task ProcessCsvFileImportJob(string filePath, ImportOptions options)
    {
        _logger.LogInformation("Starting background CSV file import job for file {FilePath}", filePath);

        try
        {
            var result = await _importService.ImportCsvFileAsync(filePath, options);

            // Send completion notification via SignalR
            await _hubContext.Clients.Group($"import_{result.ImportId}")
                .SendAsync("ImportCompleted", result);

            _logger.LogInformation("Background CSV file import job completed for file {FilePath}. Status: {Status}, Records: {Records}", 
                filePath, result.Status, result.SuccessfulRecords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background CSV file import job failed for file {FilePath}", filePath);
            throw;
        }
    }
}
