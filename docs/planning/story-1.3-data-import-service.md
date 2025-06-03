# Story 1.3: Data Import Service

## 📋 Story Overview
**As a** system administrator  
**I want** automated data import capabilities  
**So that** I can easily load historical data and update with new data

---

## 🎯 Acceptance Criteria

### Core Requirements
- [ ] CSV file parser for OHLCV data with robust error handling
- [ ] Bulk import with transaction support and rollback capabilities
- [ ] Data validation and duplicate detection with configurable rules
- [ ] Progress reporting for large imports with real-time updates
- [ ] Support for multiple file formats (CSV, JSON, XML)

### Performance Requirements
- [ ] Handle files up to 1GB in size
- [ ] Process 100,000+ records in under 5 minutes
- [ ] Memory-efficient streaming for large files
- [ ] Parallel processing for multiple files

### Quality Requirements
- [ ] Comprehensive logging of all import operations
- [ ] Detailed error reporting with line-level feedback
- [ ] Data integrity validation before commit
- [ ] Automatic backup before major imports

---

## 🛠️ Technical Tasks

### 1. Core Service Implementation
```csharp
// File: Services/IDataImportService.cs
public interface IDataImportService
{
    Task<ImportResult> ImportCsvAsync(Stream csvStream, ImportOptions options);
    Task<ImportResult> ImportJsonAsync(Stream jsonStream, ImportOptions options);
    Task<ImportProgress> GetImportProgressAsync(Guid importId);
    Task<bool> CancelImportAsync(Guid importId);
}
```

### 2. Data Models
```csharp
// File: Models/ImportModels.cs
public class ImportResult
{
    public Guid ImportId { get; set; }
    public int TotalRecords { get; set; }
    public int ProcessedRecords { get; set; }
    public int SuccessfulRecords { get; set; }
    public int FailedRecords { get; set; }
    public List<ImportError> Errors { get; set; }
    public TimeSpan Duration { get; set; }
    public ImportStatus Status { get; set; }
}

public class ImportOptions
{
    public bool SkipDuplicates { get; set; } = true;
    public bool ValidateData { get; set; } = true;
    public int BatchSize { get; set; } = 1000;
    public bool CreateBackup { get; set; } = true;
    public string DateFormat { get; set; } = "yyyy-MM-dd";
}
```

### 3. CSV Parser Implementation
- [ ] Create `CsvDataImportService` with CsvHelper library
- [ ] Implement custom type converters for financial data types
- [ ] Add support for different CSV formats and delimiters
- [ ] Handle malformed data gracefully

### 4. Background Job Processing
- [ ] Integrate Hangfire for background processing
- [ ] Create `ImportJobService` for long-running imports
- [ ] Implement job queuing and priority handling
- [ ] Add job retry logic with exponential backoff

### 5. Validation Engine
```csharp
// File: Services/DataValidationService.cs
public class DataValidationService
{
    public ValidationResult ValidateStockPrice(StockPriceDto price)
    {
        // Validate OHLC relationships (Open/Close within High/Low range)
        // Check for reasonable price ranges
        // Validate volume is non-negative
        // Ensure date is valid trading day
    }
}
```

### 6. Progress Tracking
- [ ] Implement real-time progress updates using SignalR
- [ ] Create progress storage in Redis for scalability
- [ ] Add ETA calculation based on current processing speed
- [ ] Implement cancellation token support

---

## 📁 File Structure
```
Apps/Api/
├── Services/
│   ├── IDataImportService.cs
│   ├── CsvDataImportService.cs
│   ├── JsonDataImportService.cs
│   ├── DataValidationService.cs
│   └── ImportJobService.cs
├── Models/
│   ├── ImportModels.cs
│   ├── ImportProgress.cs
│   └── ValidationResult.cs
├── Controllers/
│   └── DataImportController.cs
├── BackgroundJobs/
│   └── ImportJob.cs
└── Utilities/
    ├── CsvParser.cs
    └── FileHelper.cs
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Test CSV parsing with various formats
- [ ] Validate error handling for malformed data
- [ ] Test data validation rules
- [ ] Verify progress tracking accuracy

### Integration Tests
- [ ] Test end-to-end import process
- [ ] Verify database transaction handling
- [ ] Test background job execution
- [ ] Validate SignalR progress updates

### Performance Tests
- [ ] Benchmark large file imports
- [ ] Test memory usage under load
- [ ] Validate concurrent import handling

---

## 📊 Sample Data Formats

### CSV Format (AAPL Example)
```csv
Date,Open,High,Low,Close,Volume,OpenInt
2017-11-10,174.67,175.42,173.66,174.67,21907100,0
2017-11-09,175.11,175.38,173.92,174.25,26513400,0
```

### JSON Format
```json
{
  "symbol": "AAPL",
  "data": [
    {
      "date": "2017-11-10",
      "open": 174.67,
      "high": 175.42,
      "low": 173.66,
      "close": 174.67,
      "volume": 21907100
    }
  ]
}
```

---

## 🚀 Implementation Priority

### Phase 1: Core CSV Import (Week 1)
- Basic CSV parser for AAPL data format
- Simple validation and error handling
- Direct database insertion

### Phase 2: Enhanced Features (Week 2)
- Background job processing
- Progress tracking
- Advanced validation rules

### Phase 3: Multiple Formats (Week 3)
- JSON import support
- File format auto-detection
- Batch processing optimization

---

## 🔗 Dependencies
- **Prerequisites**: Story 1.1 (Database Design) must be complete
- **Related**: Story 1.2 (API Endpoints) for import status API
- **Follows**: Story 2.1 (Charts) will consume imported data

---

## 📈 Success Metrics
- Import 10,000+ AAPL records in under 30 seconds
- 99.9% data accuracy with validation
- Zero memory leaks during large imports
- Complete error recovery and rollback capability

---

## 🛡️ Security Considerations
- Validate file types and sizes before processing
- Sanitize all input data to prevent injection attacks
- Implement rate limiting for import endpoints
- Add audit logging for all import operations
- Secure file upload with virus scanning integration
