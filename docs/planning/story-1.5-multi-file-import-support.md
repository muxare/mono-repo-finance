# Story 1.5: Multi-File Import Support for Data Import Service

## 📋 Story Overview
**As a** system administrator  
**I want** to be able to import multiple historical finance data files in a single request  
**So that** I can streamline bulk data loading and reduce manual effort

---

## 🎯 Acceptance Criteria

### Core Requirements
- [x] API endpoint(s) to accept multiple files for import in a single request
- [x] Support for both CSV and JSON formats in batch import
- [x] Each file processed independently with individual status and error reporting
- [x] Transactional integrity: failure in one file does not affect others
- [x] Progress reporting for each file and overall batch
- [x] Real-time updates via SignalR for batch imports
- [x] Comprehensive logging for batch and per-file operations

### Performance Requirements
- [x] Efficient handling of up to 100 files per batch
- [x] Memory-efficient streaming for large files in batch
- [x] Parallel processing of files within a batch

### Quality Requirements
- [x] Detailed error reporting for each file
- [x] Data validation and duplicate detection per file
- [x] Automatic backup before batch import

---

## 🛠️ Technical Tasks

1. **API Design**
   - Update or add new endpoint(s) in `DataImportController` to accept multiple files (e.g., `IFormFileCollection`)
   - Update OpenAPI/Swagger documentation

2. **Request/Response Models**
   - Create `BatchImportRequest` and `BatchImportResult` models
   - Update validation logic for multiple files

3. **Service Layer**
   - Add service methods for batch import in `IDataImportService` and implementations
   - Ensure each file is processed in isolation (transactional boundaries)
   - Implement parallel processing for files

4. **Progress & Error Reporting**
   - Extend progress tracking to handle batch and per-file status
   - Update SignalR hub for batch import progress
   - Enhance error reporting for batch context

5. **Testing**
   - Unit and integration tests for batch import scenarios
   - Performance and stress tests for large batch imports

---

## 📁 File Structure (Proposed Additions)
```
Apps/Api/
├── Controllers/
│   └── DataImportController.cs (update)
├── Models/
│   ├── BatchImportRequest.cs (new)
│   ├── BatchImportResult.cs (new)
├── Services/
│   └── IDataImportService.cs (update)
│   └── CsvDataImportService.cs (update)
│   └── JsonDataImportService.cs (update)
│   └── ImportJobService.cs (update)
```

---

## 🧪 Testing Strategy
- Unit tests for batch import logic and error handling
- Integration tests for API endpoints with multiple files
- Performance tests for large batch imports
- Manual verification via Swagger UI and sample data files

---

## 🚀 Implementation Priority
- Phase 1: API and model changes
- Phase 2: Service and progress tracking updates
- Phase 3: Parallel processing and performance optimization
- Phase 4: Documentation and testing

---

## 🔗 Dependencies
- **Prerequisite**: Story 1.3 (Data Import Service) must be complete
- **Related**: Story 1.2 (API Endpoints), Story 1.4 (Data Calculation Service)

---

## 📈 Success Metrics
- Successfully import 100 files in a single batch with individual status
- No cross-file transaction failures
- Real-time progress and error reporting for each file
- No significant performance degradation compared to single-file imports

---

## 🛡️ Security Considerations
- Validate file types and sizes for all files in batch
- Sanitize all input data
- Rate limiting for batch endpoints
- Audit logging for batch operations

---

## ✅ Completion Criteria
- All acceptance criteria above are met
- Code reviewed and merged to main
- Documentation updated
- All tests passing 