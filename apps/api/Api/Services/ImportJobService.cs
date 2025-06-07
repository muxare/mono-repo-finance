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
    
    // Batch import methods
    string ScheduleBatchImport(IFormFileCollection files, ImportOptions options, bool processInParallel = true, int maxConcurrency = 5);
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
    /// Schedule batch import as background job
    /// </summary>
    public string ScheduleBatchImport(IFormFileCollection files, ImportOptions options, bool processInParallel = true, int maxConcurrency = 5)
    {
        // Convert files to serializable format
        var fileDataList = new List<(byte[] Data, string FileName, long Size)>();
        
        foreach (var file in files)
        {
            var memoryStream = new MemoryStream();
            file.CopyTo(memoryStream);
            fileDataList.Add((memoryStream.ToArray(), file.FileName, file.Length));
        }

        var jobId = BackgroundJob.Enqueue(() => ProcessBatchImportJob(fileDataList, options, processInParallel, maxConcurrency));
        
        _logger.LogInformation("Scheduled batch import job {JobId} for {FileCount} files", jobId, files.Count);
        
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

    /// <summary>
    /// Background job method for processing batch import
    /// </summary>
    [Queue("imports")]
    public async Task ProcessBatchImportJob(List<(byte[] Data, string FileName, long Size)> fileDataList, ImportOptions options, bool processInParallel, int maxConcurrency)
    {
        _logger.LogInformation("Starting background batch import job for {FileCount} files", fileDataList.Count);

        try
        {
            // Convert file data back to IFormFileCollection-like structure
            var formFiles = new List<IFormFile>();
            foreach (var (data, fileName, size) in fileDataList)
            {
                var stream = new MemoryStream(data);
                var formFile = new FormFile(stream, 0, size, "file", fileName)
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "application/octet-stream"
                };
                formFiles.Add(formFile);
            }

            var formFileCollection = new FormFileCollection();
            formFiles.ForEach(f => formFileCollection.Add(f));

            var result = await _importService.ImportBatchAsync(formFileCollection, options, processInParallel, maxConcurrency);

            // Send completion notification via SignalR
            await _hubContext.Clients.Group($"batch_import_{result.BatchId}")
                .SendAsync("BatchImportCompleted", result);

            _logger.LogInformation("Background batch import job completed. Status: {Status}, Files: {SuccessfulFiles}/{TotalFiles}", 
                result.OverallStatus, result.SuccessfulFiles, result.TotalFiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background batch import job failed for {FileCount} files", fileDataList.Count);
            throw;
        }
    }
}
