using Api.Models.Import;

namespace Api.Services;

/// <summary>
/// Validation result for import data
/// </summary>
public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<ImportError> Errors { get; set; } = new();
    
    public void AddError(int lineNumber, string field, string value, string message)
    {
        Errors.Add(new ImportError
        {
            LineNumber = lineNumber,
            Field = field,
            Value = value,
            ErrorMessage = message
        });
        IsValid = false;
    }
}

/// <summary>
/// Service for validating import data
/// </summary>
public interface IDataValidationService
{
    ValidationResult ValidateStockPrice(CsvPriceRecord record, int lineNumber);
    ValidationResult ValidatePriceRecords(IEnumerable<CsvPriceRecord> records);
}

public class DataValidationService : IDataValidationService
{
    private readonly ILogger<DataValidationService> _logger;

    public DataValidationService(ILogger<DataValidationService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Validate a single stock price record
    /// </summary>
    public ValidationResult ValidateStockPrice(CsvPriceRecord record, int lineNumber)
    {
        var result = new ValidationResult { IsValid = true };

        // Date validation
        if (record.Date == default)
        {
            result.AddError(lineNumber, nameof(record.Date), record.Date.ToString(), "Date cannot be empty or invalid");
        }
        else if (record.Date > DateTime.Now.Date)
        {
            result.AddError(lineNumber, nameof(record.Date), record.Date.ToString("yyyy-MM-dd"), "Date cannot be in the future");
        }
        else if (record.Date < new DateTime(1900, 1, 1))
        {
            result.AddError(lineNumber, nameof(record.Date), record.Date.ToString("yyyy-MM-dd"), "Date cannot be before 1900");
        }

        // Price validation
        if (record.Open <= 0)
        {
            result.AddError(lineNumber, nameof(record.Open), record.Open.ToString(), "Open price must be greater than 0");
        }

        if (record.High <= 0)
        {
            result.AddError(lineNumber, nameof(record.High), record.High.ToString(), "High price must be greater than 0");
        }

        if (record.Low <= 0)
        {
            result.AddError(lineNumber, nameof(record.Low), record.Low.ToString(), "Low price must be greater than 0");
        }

        if (record.Close <= 0)
        {
            result.AddError(lineNumber, nameof(record.Close), record.Close.ToString(), "Close price must be greater than 0");
        }

        // OHLC logic validation
        if (record.High < record.Low)
        {
            result.AddError(lineNumber, "OHLC", $"H:{record.High}, L:{record.Low}", "High price cannot be less than low price");
        }

        if (record.High < record.Open)
        {
            result.AddError(lineNumber, "OHLC", $"H:{record.High}, O:{record.Open}", "High price cannot be less than open price");
        }

        if (record.High < record.Close)
        {
            result.AddError(lineNumber, "OHLC", $"H:{record.High}, C:{record.Close}", "High price cannot be less than close price");
        }

        if (record.Low > record.Open)
        {
            result.AddError(lineNumber, "OHLC", $"L:{record.Low}, O:{record.Open}", "Low price cannot be greater than open price");
        }

        if (record.Low > record.Close)
        {
            result.AddError(lineNumber, "OHLC", $"L:{record.Low}, C:{record.Close}", "Low price cannot be greater than close price");
        }

        // Volume validation
        if (record.Volume < 0)
        {
            result.AddError(lineNumber, nameof(record.Volume), record.Volume.ToString(), "Volume cannot be negative");
        }

        // Extreme price validation (basic sanity checks)
        var prices = new[] { record.Open, record.High, record.Low, record.Close };
        var maxPrice = prices.Max();
        var minPrice = prices.Min();
        
        if (maxPrice > 1000000) // $1M per share seems unreasonable
        {
            result.AddError(lineNumber, "Price", maxPrice.ToString(), "Price seems unreasonably high (> $1,000,000)");
        }

        if (minPrice < 0.01m) // Less than 1 cent
        {
            result.AddError(lineNumber, "Price", minPrice.ToString(), "Price seems unreasonably low (< $0.01)");
        }

        return result;
    }

    /// <summary>
    /// Validate a collection of price records
    /// </summary>
    public ValidationResult ValidatePriceRecords(IEnumerable<CsvPriceRecord> records)
    {
        var result = new ValidationResult { IsValid = true };
        var recordList = records.ToList();
        
        _logger.LogInformation("Validating {Count} price records", recordList.Count);

        var lineNumber = 1;
        var dates = new HashSet<DateTime>();

        foreach (var record in recordList)
        {
            lineNumber++;

            // Validate individual record
            var recordResult = ValidateStockPrice(record, lineNumber);
            if (!recordResult.IsValid)
            {
                result.IsValid = false;
                result.Errors.AddRange(recordResult.Errors);
            }

            // Check for duplicate dates
            if (dates.Contains(record.Date))
            {
                result.AddError(lineNumber, nameof(record.Date), record.Date.ToString("yyyy-MM-dd"), "Duplicate date found");
            }
            else
            {
                dates.Add(record.Date);
            }
        }

        // Additional validations for the entire dataset
        if (recordList.Count == 0)
        {
            result.AddError(0, "Dataset", "Empty", "No records found in the dataset");
        }

        // Check for reasonable date sequence
        var sortedDates = recordList.Select(r => r.Date).OrderBy(d => d).ToList();
        if (sortedDates.Count > 1)
        {
            var firstDate = sortedDates.First();
            var lastDate = sortedDates.Last();
            var timeSpan = lastDate - firstDate;

            if (timeSpan.TotalDays > 365 * 50) // More than 50 years
            {
                result.AddError(0, "DateRange", $"{firstDate:yyyy-MM-dd} to {lastDate:yyyy-MM-dd}", "Date range spans more than 50 years");
            }
        }

        _logger.LogInformation("Validation completed. Valid: {IsValid}, Errors: {ErrorCount}", result.IsValid, result.Errors.Count);
        
        return result;
    }
}
