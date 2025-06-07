using Api.Models.Import;
using Api.Services;
using Api.Data;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Api.Controllers;

/// <summary>
/// Controller for data import operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DataImportController : ControllerBase
{
    private readonly IDataImportService _importService;
    private readonly IJsonDataImportService _jsonImportService;
    private readonly IImportJobService _importJobService;
    private readonly IDataValidationService _validationService;
    private readonly IAutoImportService _autoImportService;
    private readonly FinanceDbContext _context;
    private readonly ILogger<DataImportController> _logger;

    public DataImportController(
        IDataImportService importService,
        IJsonDataImportService jsonImportService,
        IImportJobService importJobService,
        IDataValidationService validationService,
        IAutoImportService autoImportService,
        FinanceDbContext context,
        ILogger<DataImportController> logger)
    {
        _importService = importService;
        _jsonImportService = jsonImportService;
        _importJobService = importJobService;
        _validationService = validationService;
        _autoImportService = autoImportService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Import stock price data from CSV file
    /// </summary>
    /// <param name="request">CSV import request with file and options</param>
    /// <returns>Import result with status and statistics</returns>
    /// <response code="200">Import completed successfully</response>
    /// <response code="400">Invalid request or validation errors</response>
    /// <response code="500">Internal server error during import</response>
    [HttpPost("csv")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ImportResult>> ImportCsv([FromForm] CsvImportRequest request)
    {
        try
        {
            _logger.LogInformation("CSV import requested for file: {FileName} ({FileSize} bytes)", 
                request.File.FileName, request.File.Length);

            // Validate file
            if (request.File.Length == 0)
            {
                return BadRequest("File is empty");
            }

            if (request.File.Length > 100 * 1024 * 1024) // 100MB limit
            {
                return BadRequest("File size exceeds 100MB limit");
            }

            var allowedExtensions = new[] { ".csv", ".txt" };
            var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest($"File type not supported. Allowed types: {string.Join(", ", allowedExtensions)}");
            }

            // Process import
            using var stream = request.File.OpenReadStream();
            var result = await _importService.ImportCsvAsync(stream, request.File.FileName, request.Options);            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during CSV import for file: {FileName}", request.File?.FileName);
            return StatusCode(500, "An error occurred during import");
        }
    }
    /// <summary>
    /// Import stock price data from CSV file using background job
    /// </summary>
    /// <param name="request">CSV import request with file and options</param>
    /// <returns>Job ID for tracking the import progress</returns>
    /// <response code="202">Import job started successfully</response>
    /// <response code="400">Invalid request</response>
    [HttpPost("csv/async")]
    [ProducesResponseType(typeof(object), 202)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<ActionResult> ImportCsvAsync([FromForm] CsvImportRequest request)
    {
        try
        {
            _logger.LogInformation("Async CSV import requested for file: {FileName} ({FileSize} bytes)", 
                request.File.FileName, request.File.Length);

            // Validate file (same as sync version)
            if (request.File.Length == 0)
            {
                return BadRequest("File is empty");
            }

            if (request.File.Length > 100 * 1024 * 1024) // 100MB limit
            {
                return BadRequest("File size exceeds 100MB limit");
            }

            var allowedExtensions = new[] { ".csv", ".txt" };
            var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest($"File type not supported. Allowed types: {string.Join(", ", allowedExtensions)}");
            }

            // Schedule background job
            using var stream = request.File.OpenReadStream();
            var jobId = _importJobService.ScheduleCsvImport(stream, request.File.FileName, request.Options);

            return Accepted(new { JobId = jobId, Message = "Import job started successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scheduling async CSV import for file: {FileName}", request.File?.FileName);
            return StatusCode(500, "An error occurred while scheduling import");
        }
    }

    /// <summary>
    /// Validate CSV file without importing
    /// </summary>
    /// <param name="request">CSV validation request</param>
    /// <returns>Validation result with any errors found</returns>
    /// <response code="200">Validation completed</response>
    /// <response code="400">Invalid request</response>
    [HttpPost("csv/validate")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<ActionResult<ImportResult>> ValidateCsv([FromForm] CsvImportRequest request)
    {
        try
        {
            _logger.LogInformation("CSV validation requested for file: {FileName}", request.File.FileName);

            // Set validation-only option
            request.Options.ValidateOnly = true;

            using var stream = request.File.OpenReadStream();
            var result = await _importService.ImportCsvAsync(stream, request.File.FileName, request.Options);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during CSV validation for file: {FileName}", request.File?.FileName);
            return StatusCode(500, "An error occurred during validation");
        }
    }

    /// <summary>
    /// Get import progress by ID
    /// </summary>
    /// <param name="importId">Import operation ID</param>
    /// <returns>Current import progress</returns>
    /// <response code="200">Progress retrieved successfully</response>
    /// <response code="404">Import not found</response>
    [HttpGet("progress/{importId}")]
    [ProducesResponseType(typeof(ImportProgress), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ImportProgress>> GetImportProgress(Guid importId)
    {
        try
        {
            var progress = await _importService.GetImportProgressAsync(importId);
            
            if (progress == null)
            {
                return NotFound($"Import with ID {importId} not found");
            }

            return Ok(progress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving import progress for ID: {ImportId}", importId);
            return StatusCode(500, "An error occurred while retrieving import progress");
        }
    }

    /// <summary>
    /// Cancel an ongoing import operation
    /// </summary>
    /// <param name="importId">Import operation ID</param>
    /// <returns>Success status</returns>
    /// <response code="200">Import cancelled successfully</response>
    /// <response code="404">Import not found</response>
    [HttpPost("cancel/{importId}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> CancelImport(Guid importId)
    {
        try
        {
            var success = await _importService.CancelImportAsync(importId);
            
            if (!success)
            {
                return NotFound($"Import with ID {importId} not found or cannot be cancelled");
            }

            return Ok(new { Message = "Import cancelled successfully", ImportId = importId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling import for ID: {ImportId}", importId);
            return StatusCode(500, "An error occurred while cancelling the import");
        }
    }

    /// <summary>
    /// Get import history
    /// </summary>
    /// <param name="skip">Number of records to skip</param>
    /// <param name="take">Number of records to take</param>
    /// <returns>List of recent import operations</returns>
    /// <response code="200">Import history retrieved successfully</response>
    [HttpGet("history")]
    [ProducesResponseType(typeof(IEnumerable<ImportResult>), 200)]
    public async Task<ActionResult<IEnumerable<ImportResult>>> GetImportHistory([FromQuery] int skip = 0, [FromQuery] int take = 20)
    {
        try
        {
            var history = await _importService.GetImportHistoryAsync(skip, take);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving import history");
            return StatusCode(500, "An error occurred while retrieving import history");
        }
    }

    /// <summary>
    /// Import stock price data from server file path (for testing)
    /// </summary>
    /// <param name="filePath">Server file path</param>
    /// <param name="options">Import options</param>
    /// <returns>Import result</returns>
    /// <response code="200">Import completed successfully</response>
    /// <response code="400">Invalid file path</response>
    /// <response code="404">File not found</response>
    [HttpPost("csv/file")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ImportResult>> ImportCsvFile(
        [FromQuery] [Required] string filePath,
        [FromBody] ImportOptions? options = null)
    {
        try
        {
            if (string.IsNullOrEmpty(filePath))
            {
                return BadRequest("File path is required");
            }

            _logger.LogInformation("File import requested for: {FilePath}", filePath);

            var result = await _importService.ImportCsvFileAsync(filePath, options ?? new ImportOptions());
            
            if (result.Status == ImportStatus.Failed && result.Message?.Contains("File not found") == true)
            {
                return NotFound(result.Message);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during file import for: {FilePath}", filePath);
            return StatusCode(500, "An error occurred during import");
        }
    }    /*
    /// <summary>
    /// Import stock price data from JSON file
    /// </summary>
    /// <param name="request">JSON import request with file and options</param>
    /// <returns>Import result with status and statistics</returns>
    /// <response code="200">Import completed successfully</response>
    /// <response code="400">Invalid request or validation errors</response>
    /// <response code="500">Internal server error during import</response>
    [HttpPost("json")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ImportResult>> ImportJson([FromForm] CsvImportRequest request)
    {
        try
        {
            _logger.LogInformation("JSON import requested for file: {FileName} ({FileSize} bytes)", 
                request.File.FileName, request.File.Length);

            // Validate file
            if (request.File.Length == 0)
            {
                return BadRequest("File is empty");
            }

            if (request.File.Length > 100 * 1024 * 1024) // 100MB limit
            {
                return BadRequest("File size exceeds 100MB limit");
            }

            var allowedExtensions = new[] { ".json" };
            var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest($"File type not supported. Allowed types: {string.Join(", ", allowedExtensions)}");
            }            // Process import
            using var stream = request.File.OpenReadStream();
            var result = await _jsonImportService.ImportJsonAsync(stream, request.File.FileName, request.Options);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during JSON import for file: {FileName}", request.File?.FileName);
            return StatusCode(500, "An error occurred during import");
        }
    }

    /// <summary>
    /// Validate JSON file without importing
    /// </summary>
    /// <param name="request">JSON validation request</param>
    /// <returns>Validation result with any errors found</returns>
    /// <response code="200">Validation completed</response>
    /// <response code="400">Invalid request</response>
    [HttpPost("json/validate")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<ActionResult<ImportResult>> ValidateJson([FromForm] CsvImportRequest request)
    {
        try
        {
            _logger.LogInformation("JSON validation requested for file: {FileName}", request.File.FileName);

            // Set validation-only option
            request.Options.ValidateOnly = true;            using var stream = request.File.OpenReadStream();
            var result = await _jsonImportService.ImportJsonAsync(stream, request.File.FileName, request.Options);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during JSON validation for file: {FileName}", request.File?.FileName);
            return StatusCode(500, "An error occurred during validation");
        }
    }
    */

    /// <summary>
    /// Auto-detect file format and import data
    /// </summary>
    /// <param name="request">Import request with file and options</param>
    /// <returns>Import result with status and statistics</returns>
    /// <response code="200">Import completed successfully</response>
    /// <response code="400">Invalid request or unsupported format</response>
    /// <response code="500">Internal server error during import</response>
    [HttpPost("auto")]
    [ProducesResponseType(typeof(ImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ImportResult>> ImportAuto([FromForm] CsvImportRequest request)
    {
        try
        {
            _logger.LogInformation("Auto-format import requested for file: {FileName} ({FileSize} bytes)", 
                request.File.FileName, request.File.Length);

            // Validate file
            if (request.File.Length == 0)
            {
                return BadRequest("File is empty");
            }

            if (request.File.Length > 100 * 1024 * 1024) // 100MB limit
            {
                return BadRequest("File size exceeds 100MB limit");
            }

            // Auto-detect file format
            var detectedFormat = DetectFileFormat(request.File);
            
            if (detectedFormat == "unknown")
            {
                return BadRequest("Unable to detect file format. Supported formats: CSV, JSON");
            }

            _logger.LogInformation("Detected file format: {Format} for file: {FileName}", detectedFormat, request.File.FileName);

            // Route to appropriate import method
            using var stream = request.File.OpenReadStream();
            
            if (detectedFormat == "csv")
            {
                var result = await _importService.ImportCsvAsync(stream, request.File.FileName, request.Options);
                return Ok(result);
            }
            else if (detectedFormat == "json")
            {
                // For now, return error since JSON import is commented out
                return BadRequest("JSON import is not currently available. Please use CSV format.");
                // var result = await _jsonImportService.ImportJsonAsync(stream, request.File.FileName, request.Options);
                // return Ok(result);
            }

            return BadRequest($"Unsupported file format: {detectedFormat}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during auto-format import for file: {FileName}", request.File?.FileName);
            return StatusCode(500, "An error occurred during import");
        }
    }

    /// <summary>
    /// Import multiple files as a batch
    /// </summary>
    /// <param name="request">Batch import request with multiple files and options</param>
    /// <returns>Batch import result with status for each file</returns>
    /// <response code="200">Batch import completed (check individual file statuses)</response>
    /// <response code="400">Invalid request</response>
    /// <response code="500">Internal server error during batch import</response>
    [HttpPost("batch")]
    [ProducesResponseType(typeof(BatchImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<BatchImportResult>> ImportBatch([FromForm] BatchImportRequest request)
    {
        try
        {
            _logger.LogInformation("Batch import requested for {FileCount} files", request.Files.Count);

            // Validate request
            if (request.Files == null || request.Files.Count == 0)
            {
                return BadRequest("No files provided for batch import");
            }

            if (request.Files.Count > 100) // Limit batch size
            {
                return BadRequest("Batch import is limited to 100 files maximum");
            }

            // Validate individual files
            var validationErrors = new List<string>();
            var totalSize = 0L;

            foreach (var file in request.Files)
            {
                if (file.Length == 0)
                {
                    validationErrors.Add($"File '{file.FileName}' is empty");
                    continue;
                }

                if (file.Length > 100 * 1024 * 1024) // 100MB per file limit
                {
                    validationErrors.Add($"File '{file.FileName}' exceeds 100MB limit");
                    continue;
                }

                totalSize += file.Length;

                var allowedExtensions = new[] { ".csv", ".txt", ".json" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    validationErrors.Add($"File '{file.FileName}' has unsupported format. Allowed: {string.Join(", ", allowedExtensions)}");
                }
            }

            if (totalSize > 1024 * 1024 * 1024) // 1GB total limit
            {
                validationErrors.Add("Total batch size exceeds 1GB limit");
            }

            if (validationErrors.Any())
            {
                return BadRequest(new { Errors = validationErrors });
            }

            // Validate concurrency settings
            if (request.MaxConcurrency < 1 || request.MaxConcurrency > 10)
            {
                request.MaxConcurrency = Math.Min(Math.Max(request.MaxConcurrency, 1), 10);
            }

            // Process batch import
            var result = await _importService.ImportBatchAsync(
                request.Files, 
                request.Options, 
                request.ProcessInParallel, 
                request.MaxConcurrency);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during batch import for {FileCount} files", request.Files?.Count ?? 0);
            return StatusCode(500, "An error occurred during batch import");
        }
    }

    /// <summary>
    /// Import multiple files as a batch using background job
    /// </summary>
    /// <param name="request">Batch import request with multiple files and options</param>
    /// <returns>Job ID for tracking the batch import progress</returns>
    /// <response code="202">Batch import job started successfully</response>
    /// <response code="400">Invalid request</response>
    [HttpPost("batch/async")]
    [ProducesResponseType(typeof(object), 202)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<ActionResult> ImportBatchAsync([FromForm] BatchImportRequest request)
    {
        try
        {
            _logger.LogInformation("Async batch import requested for {FileCount} files", request.Files.Count);

            // Same validation as synchronous batch import
            if (request.Files == null || request.Files.Count == 0)
            {
                return BadRequest("No files provided for batch import");
            }

            if (request.Files.Count > 100)
            {
                return BadRequest("Batch import is limited to 100 files maximum");
            }

            // Validate individual files
            var validationErrors = new List<string>();
            var totalSize = 0L;

            foreach (var file in request.Files)
            {
                if (file.Length == 0)
                {
                    validationErrors.Add($"File '{file.FileName}' is empty");
                    continue;
                }

                if (file.Length > 100 * 1024 * 1024)
                {
                    validationErrors.Add($"File '{file.FileName}' exceeds 100MB limit");
                    continue;
                }

                totalSize += file.Length;

                var allowedExtensions = new[] { ".csv", ".txt", ".json" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    validationErrors.Add($"File '{file.FileName}' has unsupported format. Allowed: {string.Join(", ", allowedExtensions)}");
                }
            }

            if (totalSize > 1024 * 1024 * 1024)
            {
                validationErrors.Add("Total batch size exceeds 1GB limit");
            }

            if (validationErrors.Any())
            {
                return BadRequest(new { Errors = validationErrors });
            }

            // Validate concurrency settings
            if (request.MaxConcurrency < 1 || request.MaxConcurrency > 10)
            {
                request.MaxConcurrency = Math.Min(Math.Max(request.MaxConcurrency, 1), 10);
            }

            // Schedule background job
            var jobId = _importJobService.ScheduleBatchImport(
                request.Files, 
                request.Options, 
                request.ProcessInParallel, 
                request.MaxConcurrency);

            return Accepted(new { JobId = jobId, Message = "Batch import job started successfully", FileCount = request.Files.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scheduling async batch import for {FileCount} files", request.Files?.Count ?? 0);
            return StatusCode(500, "An error occurred while scheduling batch import");
        }
    }

    /// <summary>
    /// Get batch import progress by ID
    /// </summary>
    /// <param name="batchId">Batch import operation ID</param>
    /// <returns>Current batch import progress</returns>
    /// <response code="200">Progress retrieved successfully</response>
    /// <response code="404">Batch import not found</response>
    [HttpGet("batch/progress/{batchId}")]
    [ProducesResponseType(typeof(BatchImportProgress), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<BatchImportProgress>> GetBatchImportProgress(Guid batchId)
    {
        try
        {
            var progress = await _importService.GetBatchImportProgressAsync(batchId);
            
            if (progress == null)
            {
                return NotFound($"Batch import with ID {batchId} not found");
            }

            return Ok(progress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving batch import progress for ID: {BatchId}", batchId);
            return StatusCode(500, "An error occurred while retrieving batch import progress");
        }
    }

    /// <summary>
    /// Cancel an ongoing batch import operation
    /// </summary>
    /// <param name="batchId">Batch import operation ID</param>
    /// <returns>Success status</returns>
    /// <response code="200">Batch import cancelled successfully</response>
    /// <response code="404">Batch import not found</response>
    [HttpPost("batch/cancel/{batchId}")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> CancelBatchImport(Guid batchId)
    {
        try
        {
            var success = await _importService.CancelBatchImportAsync(batchId);
            
            if (!success)
            {
                return NotFound($"Batch import with ID {batchId} not found or cannot be cancelled");
            }

            return Ok(new { Message = "Batch import cancelled successfully", BatchId = batchId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling batch import for ID: {BatchId}", batchId);
            return StatusCode(500, "An error occurred while cancelling the batch import");
        }
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
            }            return "unknown";
        }
        catch
        {
            return "unknown";
        }
    }

    /// <summary>
    /// Auto-import historical data from ExampleData folder
    /// </summary>
    /// <param name="options">Auto-import options including batch size</param>
    /// <returns>Auto-import result with detailed status for each file</returns>
    /// <response code="200">Auto-import completed successfully</response>
    /// <response code="400">Invalid request parameters</response>
    /// <response code="500">Internal server error during auto-import</response>
    [HttpPost("auto-import")]
    [ProducesResponseType(typeof(AutoImportResult), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<AutoImportResult>> AutoImportAsync([FromBody] AutoImportOptions? options = null)
    {
        try
        {
            _logger.LogInformation("Starting auto-import process");

            var importOptions = options ?? new AutoImportOptions();
            
            // Validate batch size
            if (importOptions.BatchSize <= 0 || importOptions.BatchSize > 50)
            {
                return BadRequest("Batch size must be between 1 and 50");
            }

            var result = await _autoImportService.DiscoverAndImportAsync(importOptions);
            
            _logger.LogInformation("Auto-import completed with status: {Status}", result.Status);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during auto-import");
            return StatusCode(500, "An error occurred during auto-import process");
        }
    }

    /// <summary>
    /// Get list of available files in ExampleData folder
    /// </summary>
    /// <returns>List of available CSV files</returns>
    /// <response code="200">List retrieved successfully</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("auto-import/available-files")]
    [ProducesResponseType(typeof(List<string>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<string>>> GetAvailableFilesAsync()
    {
        try
        {
            var files = await _autoImportService.GetAvailableFilesAsync();
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available files");
            return StatusCode(500, "An error occurred while retrieving available files");
        }
    }

    /// <summary>
    /// Get list of files that haven't been imported yet
    /// </summary>
    /// <returns>List of unimported CSV files</returns>
    /// <response code="200">List retrieved successfully</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("auto-import/unimported-files")]
    [ProducesResponseType(typeof(List<string>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<string>>> GetUnimportedFilesAsync()
    {
        try
        {
            var files = await _autoImportService.GetUnimportedFilesAsync();
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving unimported files");
            return StatusCode(500, "An error occurred while retrieving unimported files");
        }
    }
}