using System.ComponentModel.DataAnnotations;

namespace Api.Models.Import;

/// <summary>
/// Request model for batch import of multiple files
/// </summary>
public class BatchImportRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one file is required")]
    public IFormFileCollection Files { get; set; } = null!;
    
    public ImportOptions Options { get; set; } = new();
    
    /// <summary>
    /// Whether to process files in parallel or sequentially
    /// </summary>
    public bool ProcessInParallel { get; set; } = true;
    
    /// <summary>
    /// Maximum number of files to process concurrently (default: 5)
    /// </summary>
    public int MaxConcurrency { get; set; } = 5;
}

/// <summary>
/// Result of a batch import operation
/// </summary>
public class BatchImportResult
{
    public Guid BatchId { get; set; }
    public ImportStatus OverallStatus { get; set; }
    public string? Message { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int TotalFiles { get; set; }
    public int CompletedFiles { get; set; }
    public int SuccessfulFiles { get; set; }
    public int FailedFiles { get; set; }
    public List<FileImportResult> FileResults { get; set; } = new();
    public BatchImportSummary Summary { get; set; } = new();
}

/// <summary>
/// Result of importing a single file within a batch
/// </summary>
public class FileImportResult
{
    public string FileName { get; set; } = string.Empty;
    public ImportResult ImportResult { get; set; } = new();
    public int FileIndex { get; set; }
    public long FileSizeBytes { get; set; }
    public string? DetectedFormat { get; set; }
}

/// <summary>
/// Summary statistics for batch import
/// </summary>
public class BatchImportSummary
{
    public int TotalRecordsProcessed { get; set; }
    public int TotalSuccessfulRecords { get; set; }
    public int TotalFailedRecords { get; set; }
    public TimeSpan TotalProcessingTime { get; set; }
    public double AverageRecordsPerSecond => TotalProcessingTime.TotalSeconds > 0 
        ? TotalSuccessfulRecords / TotalProcessingTime.TotalSeconds 
        : 0;
}

/// <summary>
/// Progress tracking for batch import operations
/// </summary>
public class BatchImportProgress
{
    public Guid BatchId { get; set; }
    public ImportStatus Status { get; set; }
    public int TotalFiles { get; set; }
    public int CompletedFiles { get; set; }
    public int SuccessfulFiles { get; set; }
    public int FailedFiles { get; set; }
    public double ProgressPercentage => TotalFiles > 0 ? (double)CompletedFiles / TotalFiles * 100 : 0;
    public DateTime StartTime { get; set; }
    public DateTime? EstimatedEndTime { get; set; }
    public string? CurrentOperation { get; set; }
    public List<FileImportProgress> FileProgresses { get; set; } = new();
    public BatchImportSummary CurrentSummary { get; set; } = new();
}

/// <summary>
/// Progress tracking for individual files within a batch
/// </summary>
public class FileImportProgress
{
    public string FileName { get; set; } = string.Empty;
    public int FileIndex { get; set; }
    public ImportStatus Status { get; set; }
    public ImportProgress? ImportProgress { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? ErrorMessage { get; set; }
}
