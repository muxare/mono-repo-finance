using System.ComponentModel.DataAnnotations;

namespace Api.Models.Import;

/// <summary>
/// Result of an import operation
/// </summary>
public class ImportResult
{
    public Guid ImportId { get; set; }
    public ImportStatus Status { get; set; }
    public string? Message { get; set; }
    public int ProcessedRecords { get; set; }
    public int SuccessfulRecords { get; set; }
    public int FailedRecords { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}

/// <summary>
/// Import operation status
/// </summary>
public enum ImportStatus
{
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled
}

/// <summary>
/// Options for configuring import behavior
/// </summary>
public class ImportOptions
{
    public bool SkipDuplicates { get; set; } = true;
    public string DateFormat { get; set; } = "yyyy-MM-dd";
    public bool ValidateOnly { get; set; } = false;
    public int BatchSize { get; set; } = 1000;
    public bool UseTransaction { get; set; } = true;
    public bool CreateBackup { get; set; } = true;
    public string? Symbol { get; set; }
}

/// <summary>
/// Import error information
/// </summary>
public class ImportError
{
    public int LineNumber { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}

/// <summary>
/// Progress tracking for import operations
/// </summary>
public class ImportProgress
{
    public Guid ImportId { get; set; }
    public ImportStatus Status { get; set; }
    public int TotalRecords { get; set; }
    public int ProcessedRecords { get; set; }
    public int SuccessfulRecords { get; set; }
    public int FailedRecords { get; set; }
    public double ProgressPercentage => TotalRecords > 0 ? (double)ProcessedRecords / TotalRecords * 100 : 0;
    public DateTime StartTime { get; set; }
    public DateTime? EstimatedEndTime { get; set; }
    public string? CurrentOperation { get; set; }
    public List<ImportError> RecentErrors { get; set; } = new();
}

/// <summary>
/// Request model for CSV import
/// </summary>
public class CsvImportRequest
{
    [Required]
    public IFormFile File { get; set; } = null!;
    
    public ImportOptions Options { get; set; } = new();
}

/// <summary>
/// Data model for CSV price records
/// </summary>
public class CsvPriceRecord
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
    public int? OpenInt { get; set; }
}
