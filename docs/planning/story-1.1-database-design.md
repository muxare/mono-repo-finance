# Story 1.1: Database Design & Entity Framework Setup

## 📋 Story Overview
- **Epic**: Data Infrastructure & Backend Services
- **Story ID**: 1.1
- **Priority**: High
- **Story Points**: 8
- **Sprint**: 1

## 🎯 User Story
**As a** developer  
**I want** a well-structured database schema for financial data  
**So that** I can efficiently store and query historical and real-time stock data

## 📝 Acceptance Criteria
- [ ] Design Entity Framework models for Stock, StockPrice, Sector, Exchange entities
- [ ] Create database migrations for financial data schema
- [ ] Implement proper indexing for time-series data queries
- [ ] Add support for multiple data sources and symbols
- [ ] Create seed data from AAPL CSV file

## 🔧 Technical Tasks

### Database Schema Design
- [ ] **Stock Entity (`Stock.cs`)**
  - Properties: Id, Symbol, Name, Sector, Exchange, MarketCap, Description, etc.
  - Relationships: One-to-Many with StockPrices
  - Constraints: Unique symbol per exchange

- [ ] **StockPrice Entity (`StockPrice.cs`)**
  - Properties: Id, StockId, Date, Open, High, Low, Close, Volume, AdjustedClose
  - Relationships: Many-to-One with Stock
  - Indexes: Composite index on (StockId, Date) for time-series queries

- [ ] **Sector Entity (`Sector.cs`)**
  - Properties: Id, Name, Description
  - Relationships: One-to-Many with Stocks

- [ ] **Exchange Entity (`Exchange.cs`)**
  - Properties: Id, Name, Code, Country, Timezone
  - Relationships: One-to-Many with Stocks

### Entity Framework Configuration
- [ ] **DbContext Setup (`FinanceDbContext.cs`)**
  - Configure entity relationships
  - Add fluent API configurations
  - Set up connection string management
  - Configure database provider (SQL Server)

- [ ] **Entity Configurations**
  - `StockConfiguration.cs` - Configure Stock entity
  - `StockPriceConfiguration.cs` - Configure StockPrice entity
  - `SectorConfiguration.cs` - Configure Sector entity
  - `ExchangeConfiguration.cs` - Configure Exchange entity

### Database Migrations
- [ ] **Initial Migration**
  - Create tables for all entities
  - Add primary and foreign key constraints
  - Set up initial indexes

- [ ] **Performance Indexes**
  - Clustered index on StockPrice.Date
  - Non-clustered index on Stock.Symbol
  - Composite index on (StockId, Date) for StockPrice
  - Index on Stock.Sector and Stock.Exchange

### Data Seeding
- [ ] **Seed Data Service (`DataSeedService.cs`)**
  - Load reference data (Sectors, Exchanges)
  - Import AAPL data from CSV file
  - Validate data integrity
  - Handle duplicate records

## 🛠️ Implementation Details

### Entity Models

```csharp
// Stock.cs
public class Stock
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SectorId { get; set; }
    public int ExchangeId { get; set; }
    public decimal? MarketCap { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation Properties
    public Sector Sector { get; set; } = null!;
    public Exchange Exchange { get; set; } = null!;
    public ICollection<StockPrice> Prices { get; set; } = new List<StockPrice>();
}

// StockPrice.cs
public class StockPrice
{
    public long Id { get; set; }
    public int StockId { get; set; }
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
    public decimal? AdjustedClose { get; set; }
    
    // Navigation Property
    public Stock Stock { get; set; } = null!;
}
```

### Database Indexes Strategy

```sql
-- Primary indexes for performance
CREATE CLUSTERED INDEX IX_StockPrice_StockId_Date 
ON StockPrices (StockId, Date);

CREATE NONCLUSTERED INDEX IX_Stock_Symbol 
ON Stocks (Symbol);

CREATE NONCLUSTERED INDEX IX_StockPrice_Date 
ON StockPrices (Date);

-- Covering indexes for common queries
CREATE NONCLUSTERED INDEX IX_StockPrice_StockId_Date_OHLCV 
ON StockPrices (StockId, Date) 
INCLUDE (Open, High, Low, Close, Volume);
```

## 🧪 Testing Strategy

### Unit Tests
- [ ] **Entity Model Tests**
  - Validate entity properties and relationships
  - Test data annotations and constraints
  - Verify navigation properties

- [ ] **DbContext Tests**
  - Test entity configuration
  - Verify relationship mappings
  - Check index creation

### Integration Tests
- [ ] **Database Integration Tests**
  - Test migrations up and down
  - Verify data seeding process
  - Test query performance with indexes

## 📊 Performance Considerations

### Query Optimization
- **Time-series queries**: Optimized with clustered index on (StockId, Date)
- **Symbol lookups**: Fast retrieval with index on Symbol
- **Sector/Exchange filtering**: Indexed foreign keys

### Data Volume Planning
- **Estimated daily records**: 10,000 stocks × 1 price = 10K records/day
- **Annual volume**: ~3.6M records/year
- **5-year projection**: ~18M records
- **Storage estimate**: ~2GB for 5 years of data

## 🔗 Dependencies
- **Upstream**: None
- **Downstream**: 
  - Story 1.2: Financial Data API Endpoints
  - Story 1.3: Data Import Service

## 📋 Definition of Done
- [ ] All entity models created with proper relationships
- [ ] Database migrations run successfully
- [ ] All indexes created and tested
- [ ] AAPL data successfully imported
- [ ] Unit tests pass with >95% coverage
- [ ] Performance benchmarks meet requirements
- [ ] Code review completed
- [ ] Documentation updated

## 🎯 Success Metrics
- **Migration time**: < 30 seconds
- **AAPL data import**: < 2 minutes for 8K+ records
- **Query performance**: < 100ms for date range queries
- **Index effectiveness**: > 95% index usage for common queries

## 📚 Resources
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [SQL Server Indexing Best Practices](https://docs.microsoft.com/en-us/sql/relational-databases/indexes/)
- [Time Series Database Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/best-practices/time-series)
