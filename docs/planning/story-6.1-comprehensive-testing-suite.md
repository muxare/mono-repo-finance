# Story 6.1: Comprehensive Testing Suite

## Story Overview
**As a** developer  
**I want** comprehensive test coverage across all application layers  
**So that** the application is reliable, maintainable, and bugs are caught early in development

## Epic
Epic 6: Testing & Quality Assurance

## Priority
High

## Story Points
13

## Dependencies
- All previous stories (testing infrastructure spans entire application)
- Story 5.1: Real-time Price Updates (for testing WebSocket functionality)
- Story 2.1: Candlestick Chart Component (for testing chart components)

---

## Acceptance Criteria

### AC 6.1.1: Unit Testing Coverage (>90%)
**Given** the application codebase  
**When** unit tests are executed  
**Then** test coverage should exceed 90% for all business logic  
**And** all utility functions should have 100% coverage  
**And** critical calculation functions should have comprehensive test cases  
**And** edge cases and error conditions should be tested

### AC 6.1.2: Integration Testing for API Endpoints
**Given** API endpoints are implemented  
**When** integration tests are run  
**Then** all endpoints should return correct data formats  
**And** error scenarios should be properly handled  
**And** authentication and authorization should be tested  
**And** database operations should be verified

### AC 6.1.3: Component Testing for React Components
**Given** React components are developed  
**When** component tests are executed  
**Then** component rendering should be verified  
**And** user interactions should be tested  
**And** props and state changes should be validated  
**And** accessibility requirements should be tested

### AC 6.1.4: End-to-End Testing for Critical User Flows
**Given** critical user journeys are identified  
**When** E2E tests are run  
**Then** complete user workflows should be validated  
**And** cross-browser compatibility should be verified  
**And** mobile responsiveness should be tested  
**And** performance characteristics should be measured

### AC 6.1.5: Performance Testing for Data-Heavy Operations
**Given** data-intensive operations exist  
**When** performance tests are executed  
**Then** chart rendering performance should meet benchmarks  
**And** large dataset operations should complete within time limits  
**And** memory usage should remain within acceptable bounds  
**And** concurrent user scenarios should be tested

---

## Technical Implementation

### Phase 1: Unit Testing Infrastructure (Week 1)
**Objective**: Set up comprehensive unit testing framework

**Tasks:**
- Configure Jest with TypeScript support
- Set up testing utilities and helpers
- Create test data factories and mocks
- Implement code coverage reporting
- Add pre-commit hooks for test execution

**Files to Create/Modify:**
```
jest.config.js
jest.setup.ts
apps/web/src/__tests__/setup.ts
apps/web/src/__tests__/utils/testUtils.tsx
apps/web/src/__tests__/mocks/apiMocks.ts
apps/web/src/__tests__/factories/stockDataFactory.ts
apps/api/Api.Tests/TestFixture.cs
apps/api/Api.Tests/Helpers/DatabaseTestHelper.cs
```

**Jest Configuration:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/**/*.stories.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

### Phase 2: Component Testing Setup (Week 2)
**Objective**: Implement comprehensive React component testing

**Tasks:**
- Set up React Testing Library
- Create component testing utilities
- Implement accessibility testing
- Add visual regression testing
- Create interaction testing helpers

**Files to Create/Modify:**
```
apps/web/src/__tests__/components/Charts/CandlestickChart.test.tsx
apps/web/src/__tests__/components/Stocks/StockList.test.tsx
apps/web/src/__tests__/components/UI/SearchBox.test.tsx
apps/web/src/__tests__/utils/renderWithProviders.tsx
apps/web/src/__tests__/utils/accessibilityHelpers.ts
apps/web/src/__tests__/utils/chartTestHelpers.ts
```

**Component Testing Pattern:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../utils/renderWithProviders'
import { StockCard } from '../../../components/Stocks/StockCard'
import { mockStockData } from '../../mocks/stockData'

describe('StockCard', () => {
  test('renders stock information correctly', () => {
    renderWithProviders(<StockCard stock={mockStockData.apple} />)
    
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText('$150.25')).toBeInTheDocument()
  })
  
  test('shows price change indicator', () => {
    const stockWithGain = { ...mockStockData.apple, change: 5.25 }
    renderWithProviders(<StockCard stock={stockWithGain} />)
    
    const changeIndicator = screen.getByTestId('price-change')
    expect(changeIndicator).toHaveClass('positive')
    expect(changeIndicator).toHaveTextContent('+5.25')
  })
  
  test('handles click interaction', async () => {
    const onCardClick = jest.fn()
    renderWithProviders(
      <StockCard stock={mockStockData.apple} onClick={onCardClick} />
    )
    
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(onCardClick).toHaveBeenCalledWith('AAPL')
    })
  })
})
```

### Phase 3: API Integration Testing (Week 3)
**Objective**: Implement comprehensive API testing

**Tasks:**
- Set up API testing framework for .NET
- Create database test fixtures
- Implement endpoint testing
- Add authentication testing
- Create performance benchmarks for APIs

**Files to Create/Modify:**
```
apps/api/Api.Tests/Controllers/StocksControllerTests.cs
apps/api/Api.Tests/Controllers/PricesControllerTests.cs
apps/api/Api.Tests/Services/StockServiceTests.cs
apps/api/Api.Tests/Integration/DatabaseIntegrationTests.cs
apps/api/Api.Tests/Performance/ApiPerformanceTests.cs
apps/api/Api.Tests/Fixtures/WebApplicationFactory.cs
```

**API Testing Example:**
```csharp
[TestClass]
public class StocksControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    
    public StocksControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }
    
    [Test]
    public async Task GetStocks_ReturnsValidStockList()
    {
        // Arrange
        var expectedStocks = TestDataHelper.GetSampleStocks();
        
        // Act
        var response = await _client.GetAsync("/api/stocks");
        var content = await response.Content.ReadAsStringAsync();
        var stocks = JsonSerializer.Deserialize<List<StockDto>>(content);
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stocks.Should().NotBeEmpty();
        stocks.First().Symbol.Should().NotBeNullOrEmpty();
    }
    
    [Test]
    public async Task GetStockPrices_WithDateRange_ReturnsFilteredData()
    {
        // Arrange
        var symbol = "AAPL";
        var fromDate = DateTime.Now.AddDays(-30);
        var toDate = DateTime.Now;
        
        // Act
        var response = await _client.GetAsync(
            $"/api/stocks/{symbol}/prices?from={fromDate:yyyy-MM-dd}&to={toDate:yyyy-MM-dd}"
        );
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var prices = await response.Content.ReadFromJsonAsync<List<PriceDto>>();
        prices.Should().AllSatisfy(p => 
            p.Date >= fromDate && p.Date <= toDate
        );
    }
}
```

### Phase 4: End-to-End Testing with Playwright (Week 4)
**Objective**: Implement comprehensive E2E testing

**Tasks:**
- Set up Playwright testing framework
- Create page object models
- Implement critical user journey tests
- Add cross-browser testing
- Create mobile responsiveness tests

**Files to Create/Modify:**
```
tests/e2e/specs/stockSearch.spec.ts
tests/e2e/specs/chartInteraction.spec.ts
tests/e2e/specs/watchlistManagement.spec.ts
tests/e2e/pages/StockDetailPage.ts
tests/e2e/pages/DashboardPage.ts
tests/e2e/utils/testHelpers.ts
playwright.config.ts
```

**E2E Testing Example:**
```typescript
import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/DashboardPage'
import { StockDetailPage } from '../pages/StockDetailPage'

test.describe('Stock Analysis Workflow', () => {
  test('user can search and analyze a stock', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    const stockDetail = new StockDetailPage(page)
    
    // Navigate to dashboard
    await dashboard.goto()
    
    // Search for a stock
    await dashboard.searchStock('AAPL')
    await dashboard.selectStockFromResults('AAPL')
    
    // Verify stock detail page
    await expect(stockDetail.stockSymbol).toHaveText('AAPL')
    await expect(stockDetail.stockName).toHaveText('Apple Inc.')
    
    // Interact with chart
    await stockDetail.changeTimeframe('1M')
    await stockDetail.waitForChartLoad()
    
    // Verify chart updated
    await expect(stockDetail.chart).toBeVisible()
    await expect(stockDetail.chartTimeframe).toHaveText('1M')
    
    // Add to watchlist
    await stockDetail.addToWatchlist()
    await expect(stockDetail.watchlistButton).toHaveText('Remove from Watchlist')
  })
  
  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    
    // Verify mobile layout
    await expect(dashboard.mobileMenu).toBeVisible()
    await expect(dashboard.desktopSidebar).toBeHidden()
    
    // Test mobile navigation
    await dashboard.openMobileMenu()
    await dashboard.navigateToWatchlist()
    
    await expect(page).toHaveURL('/watchlist')
  })
})
```

---

## Test Data Management

### Test Data Factories
```typescript
// Stock data factory
export const createMockStock = (overrides: Partial<Stock> = {}): Stock => ({
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 150.25,
  change: 2.15,
  changePercent: 1.45,
  volume: 75000000,
  marketCap: 2500000000000,
  sector: 'Technology',
  ...overrides
})

// Price history factory
export const createMockPriceHistory = (
  days: number = 30,
  basePrice: number = 150
): PriceData[] => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    open: basePrice + Math.random() * 10 - 5,
    high: basePrice + Math.random() * 15,
    low: basePrice - Math.random() * 10,
    close: basePrice + Math.random() * 10 - 5,
    volume: Math.floor(Math.random() * 100000000)
  }))
}
```

### Database Test Fixtures
```csharp
public class DatabaseFixture : IDisposable
{
    public ApplicationDbContext Context { get; private set; }
    
    public DatabaseFixture()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
            
        Context = new ApplicationDbContext(options);
        SeedTestData();
    }
    
    private void SeedTestData()
    {
        var stocks = new List<Stock>
        {
            new Stock { Symbol = "AAPL", Name = "Apple Inc.", Sector = "Technology" },
            new Stock { Symbol = "GOOGL", Name = "Alphabet Inc.", Sector = "Technology" },
            new Stock { Symbol = "MSFT", Name = "Microsoft Corp.", Sector = "Technology" }
        };
        
        Context.Stocks.AddRange(stocks);
        Context.SaveChanges();
    }
    
    public void Dispose()
    {
        Context.Dispose();
    }
}
```

---

## Testing Utilities and Helpers

### React Testing Utilities
```typescript
// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions = {}
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider theme={testTheme}>
          {children}
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
  
  return render(ui, { wrapper: AllProviders, ...options })
}

// Chart testing helpers
export const waitForChartRender = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('chart-container')).toBeInTheDocument()
  }, { timeout: 5000 })
}

export const simulateChartInteraction = (action: 'zoom' | 'pan', params: any) => {
  const chart = screen.getByTestId('chart-canvas')
  
  switch (action) {
    case 'zoom':
      fireEvent.wheel(chart, { deltaY: params.direction })
      break
    case 'pan':
      fireEvent.mouseDown(chart, { clientX: params.startX, clientY: params.startY })
      fireEvent.mouseMove(chart, { clientX: params.endX, clientY: params.endY })
      fireEvent.mouseUp(chart)
      break
  }
}
```

### API Testing Helpers
```csharp
public static class ApiTestHelpers
{
    public static async Task<T> GetJsonResponse<T>(
        this HttpClient client, 
        string url
    )
    {
        var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }
    
    public static async Task<HttpResponseMessage> PostJsonAsync<T>(
        this HttpClient client,
        string url,
        T data
    )
    {
        var json = JsonSerializer.Serialize(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        return await client.PostAsync(url, content);
    }
}
```

---

## Performance Testing

### Load Testing with k6
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }    // Ramp down
  ]
}

export default function () {
  // Test stock list endpoint
  let response = http.get('http://localhost:5000/api/stocks')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  })
  
  // Test stock detail endpoint
  response = http.get('http://localhost:5000/api/stocks/AAPL')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300
  })
  
  sleep(1)
}
```

### Frontend Performance Testing
```typescript
describe('Performance Tests', () => {
  test('chart renders large dataset within performance budget', async () => {
    const largeDataset = createMockPriceHistory(10000)
    
    const startTime = performance.now()
    renderWithProviders(<CandlestickChart data={largeDataset} />)
    await waitForChartRender()
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(2000) // 2 second budget
  })
  
  test('virtual list handles large datasets efficiently', () => {
    const largeStockList = Array.from({ length: 50000 }, (_, i) => 
      createMockStock({ symbol: `STOCK${i}` })
    )
    
    const { container } = renderWithProviders(
      <VirtualStockList stocks={largeStockList} />
    )
    
    // Should only render visible items
    expect(container.querySelectorAll('[data-testid="stock-item"]')).toHaveLength(20)
  })
})
```

---

## Continuous Integration Testing

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: dotnet test apps/api/Api.Tests/
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

---

## Test Metrics and Reporting

### Coverage Reporting
```typescript
// Coverage thresholds
const coverageThresholds = {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },
  './src/utils/': {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  },
  './src/services/': {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95
  }
}
```

### Test Quality Metrics
- **Test Coverage**: >90% line coverage
- **Test Performance**: Unit tests <5s, E2E tests <5min
- **Test Reliability**: <1% flaky test rate
- **Test Maintainability**: Clear test descriptions and setup

---

## Definition of Done

### Completion Criteria
- [ ] All acceptance criteria are met
- [ ] Unit test coverage exceeds 90%
- [ ] All API endpoints have integration tests
- [ ] Critical user flows have E2E tests
- [ ] Component tests cover user interactions
- [ ] Performance tests validate benchmarks
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Accessibility requirements tested
- [ ] CI/CD pipeline includes all test types
- [ ] Test documentation updated
- [ ] Code review completed

### Success Metrics
- Zero critical bugs in production
- Test suite execution time <10 minutes
- 95% test reliability (non-flaky)
- Performance benchmarks consistently met
- Accessibility compliance verified
