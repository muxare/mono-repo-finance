# Story 1.2: Financial Data API Endpoints

## 📋 Story Overview
- **Epic**: Data Infrastructure & Backend Services
- **Story ID**: 1.2
- **Priority**: High
- **Story Points**: 13
- **Sprint**: 2

## 🎯 User Story
**As a** frontend developer  
**I want** RESTful API endpoints for financial data  
**So that** I can fetch stock data for visualization and analysis

## 📝 Acceptance Criteria
- [ ] GET /api/stocks - List all available stocks with pagination
- [ ] GET /api/stocks/{symbol} - Get stock details
- [ ] GET /api/stocks/{symbol}/prices - Get historical prices with date range filtering
- [ ] GET /api/stocks/{symbol}/prices/latest - Get latest price data
- [ ] GET /api/sectors - Get all sectors with stock counts
- [ ] GET /api/exchanges - Get all exchanges
- [ ] Implement proper error handling and validation
- [ ] Add Swagger documentation for all endpoints

## 🔧 Technical Tasks

### API Controllers
- [ ] **StocksController.cs**
  - GET /api/stocks (with pagination, filtering, sorting)
  - GET /api/stocks/{symbol}
  - POST /api/stocks (admin only)
  - PUT /api/stocks/{symbol} (admin only)
  - DELETE /api/stocks/{symbol} (admin only)

- [ ] **StockPricesController.cs**
  - GET /api/stocks/{symbol}/prices
  - GET /api/stocks/{symbol}/prices/latest
  - GET /api/stocks/{symbol}/prices/range
  - POST /api/stocks/{symbol}/prices (admin only)

- [ ] **SectorsController.cs**
  - GET /api/sectors
  - GET /api/sectors/{id}/stocks

- [ ] **ExchangesController.cs**
  - GET /api/exchanges
  - GET /api/exchanges/{id}/stocks

### Data Transfer Objects (DTOs)
- [ ] **Request DTOs**
  - `StockQueryParameters.cs` - Pagination and filtering
  - `PriceRangeRequest.cs` - Date range filtering
  - `CreateStockRequest.cs` - Stock creation
  - `UpdateStockRequest.cs` - Stock updates

- [ ] **Response DTOs**
  - `StockDto.cs` - Stock details
  - `StockSummaryDto.cs` - Stock list item
  - `StockPriceDto.cs` - Price data
  - `SectorDto.cs` - Sector information
  - `ExchangeDto.cs` - Exchange information
  - `PagedResult<T>.cs` - Paginated responses

### Services Layer
- [ ] **IStockService.cs & StockService.cs**
  - Business logic for stock operations
  - Data validation and transformation
  - Caching strategies

- [ ] **IStockPriceService.cs & StockPriceService.cs**
  - Price data retrieval and calculation
  - Technical analysis helpers
  - Performance optimization

### Validation & Error Handling
- [ ] **Input Validation**
  - FluentValidation rules for all DTOs
  - Symbol format validation
  - Date range validation
  - Pagination parameter validation

- [ ] **Error Handling Middleware**
  - Global exception handling
  - Structured error responses
  - Logging integration

## 🛠️ Implementation Details

### API Endpoints Specification

#### Stocks Endpoints
```csharp
[ApiController]
[Route("api/stocks")]
public class StocksController : ControllerBase
{
    // GET /api/stocks?page=1&pageSize=20&sector=Technology&search=APP
    [HttpGet]
    public async Task<ActionResult<PagedResult<StockSummaryDto>>> GetStocks(
        [FromQuery] StockQueryParameters parameters)
    
    // GET /api/stocks/AAPL
    [HttpGet("{symbol}")]
    public async Task<ActionResult<StockDto>> GetStock(string symbol)
    
    // POST /api/stocks
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StockDto>> CreateStock(CreateStockRequest request)
}
```

#### Stock Prices Endpoints
```csharp
[ApiController]
[Route("api/stocks/{symbol}/prices")]
public class StockPricesController : ControllerBase
{
    // GET /api/stocks/AAPL/prices?from=2024-01-01&to=2024-12-31&interval=daily
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockPriceDto>>> GetPrices(
        string symbol, [FromQuery] PriceRangeRequest request)
    
    // GET /api/stocks/AAPL/prices/latest
    [HttpGet("latest")]
    public async Task<ActionResult<StockPriceDto>> GetLatestPrice(string symbol)
    
    // GET /api/stocks/AAPL/prices/ohlc?period=1Y
    [HttpGet("ohlc")]
    public async Task<ActionResult<IEnumerable<OhlcDto>>> GetOhlcData(
        string symbol, [FromQuery] string period = "1Y")
}
```

### DTO Models

```csharp
public class StockDto
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sector { get; set; } = string.Empty;
    public string Exchange { get; set; } = string.Empty;
    public decimal? MarketCap { get; set; }
    public string? Description { get; set; }
    public StockPriceDto? LatestPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class StockPriceDto
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
    public decimal? AdjustedClose { get; set; }
    public decimal? Change { get; set; }
    public decimal? ChangePercent { get; set; }
}

public class PagedResult<T>
{
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
```

### Query Parameters & Filtering

```csharp
public class StockQueryParameters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Sector { get; set; }
    public string? Exchange { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public long? MinVolume { get; set; }
    public string? SortBy { get; set; } = "Symbol";
    public string? SortOrder { get; set; } = "asc";
}

public class PriceRangeRequest
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string Interval { get; set; } = "daily"; // daily, weekly, monthly
    public bool IncludeAdjusted { get; set; } = false;
}
```

## 🧪 Testing Strategy

### Unit Tests
- [ ] **Controller Tests**
  - Test all endpoint responses
  - Validate input parameter handling
  - Test error scenarios
  - Mock service dependencies

- [ ] **Service Tests**
  - Business logic validation
  - Data transformation tests
  - Repository interaction tests

### Integration Tests
- [ ] **API Integration Tests**
  - End-to-end API testing
  - Database integration
  - Authentication/authorization tests
  - Performance tests for large datasets

## 📊 Performance Considerations

### Caching Strategy
- [ ] **Memory Caching**
  - Cache stock metadata (5-minute expiry)
  - Cache sector and exchange lists (1-hour expiry)
  - Cache latest prices (30-second expiry)

### Query Optimization
- [ ] **Database Queries**
  - Use projection to limit data transfer
  - Implement efficient pagination
  - Optimize date range queries with indexes

### Response Optimization
- [ ] **Data Transfer**
  - Compress responses with gzip
  - Use appropriate HTTP caching headers
  - Implement ETags for conditional requests

## 📚 Swagger Documentation

```csharp
/// <summary>
/// Retrieves a paginated list of stocks with optional filtering
/// </summary>
/// <param name="parameters">Query parameters for filtering and pagination</param>
/// <returns>Paginated list of stocks</returns>
/// <response code="200">Returns the paginated stock list</response>
/// <response code="400">Invalid query parameters</response>
[HttpGet]
[ProducesResponseType(typeof(PagedResult<StockSummaryDto>), 200)]
[ProducesResponseType(typeof(ErrorResponse), 400)]
public async Task<ActionResult<PagedResult<StockSummaryDto>>> GetStocks(
    [FromQuery] StockQueryParameters parameters)
```

## 🔗 Dependencies
- **Upstream**: Story 1.1 (Database Design & Entity Framework Setup)
- **Downstream**: 
  - Story 2.1.1: Context API Data Management
  - Story 2.1.2: Backend Request Infrastructure
  - Story 2.1.3: D3.js Candlestick Chart Component
  - Story 3.1: Stock Search & Filter

## 📋 Definition of Done
- [ ] All API endpoints implemented and tested
- [ ] Swagger documentation complete
- [ ] Input validation implemented
- [ ] Error handling middleware configured
- [ ] Unit tests pass with >90% coverage
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] API documentation published

## 🎯 Success Metrics
- **Response time**: < 200ms for stock list queries
- **Throughput**: > 1000 requests/minute
- **Error rate**: < 1% for valid requests
- **Cache hit ratio**: > 80% for repeated requests

## 📚 Resources
- [ASP.NET Core Web API Documentation](https://docs.microsoft.com/en-us/aspnet/core/web-api/)
- [REST API Design Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [OpenAPI (Swagger) Specification](https://swagger.io/specification/)
