# Story 3.1: Stock Search and Symbol Management

## 📋 Story Overview
**As a** user  
**I want** to search for stocks and manage my watchlist  
**So that** I can easily find and track the stocks I'm interested in

---

## 🎯 Acceptance Criteria

### Search Functionality
- [ ] Fast autocomplete search with fuzzy matching
- [ ] Search by symbol, company name, or sector
- [ ] Real-time search suggestions (< 200ms response)
- [ ] Search result ranking by relevance and popularity
- [ ] Recent searches and popular stocks display

### Symbol Management
- [ ] Add/remove stocks from personal watchlist
- [ ] Organize stocks into custom categories/groups
- [ ] Bulk import/export of watchlists
- [ ] Share watchlists with other users
- [ ] Default market index tracking (S&P 500, NASDAQ, etc.)

### Data Enrichment
- [ ] Company profiles with sector, industry, market cap
- [ ] Basic financial metrics (P/E ratio, dividend yield)
- [ ] Logo integration and company branding
- [ ] Exchange information and trading hours
- [ ] News headlines and recent announcements

---

## 🛠️ Technical Implementation

### 1. Search API Endpoints
```csharp
// File: Controllers/StockSearchController.cs
[ApiController]
[Route("api/[controller]")]
public class StockSearchController : ControllerBase
{
    private readonly IStockSearchService _searchService;
    private readonly IWatchlistService _watchlistService;

    [HttpGet("search")]
    public async Task<ActionResult<SearchResultDto>> SearchStocks(
        [FromQuery] string query,
        [FromQuery] int limit = 10,
        [FromQuery] string[] sectors = null)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return BadRequest("Query must be at least 2 characters");

        var results = await _searchService.SearchAsync(query, limit, sectors);
        return Ok(results);
    }

    [HttpGet("popular")]
    public async Task<ActionResult<List<PopularStockDto>>> GetPopularStocks()
    {
        var popularStocks = await _searchService.GetPopularStocksAsync();
        return Ok(popularStocks);
    }

    [HttpGet("trending")]
    public async Task<ActionResult<List<TrendingStockDto>>> GetTrendingStocks()
    {
        var trendingStocks = await _searchService.GetTrendingStocksAsync();
        return Ok(trendingStocks);
    }

    [HttpGet("{symbol}/profile")]
    public async Task<ActionResult<CompanyProfileDto>> GetCompanyProfile(string symbol)
    {
        var profile = await _searchService.GetCompanyProfileAsync(symbol);
        if (profile == null)
            return NotFound($"No profile found for symbol {symbol}");
        
        return Ok(profile);
    }
}

// File: Controllers/WatchlistController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WatchlistController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserWatchlistDto>> GetUserWatchlist()
    {
        var userId = User.GetUserId();
        var watchlist = await _watchlistService.GetUserWatchlistAsync(userId);
        return Ok(watchlist);
    }

    [HttpPost("symbols/{symbol}")]
    public async Task<ActionResult> AddToWatchlist(string symbol, [FromBody] AddToWatchlistRequest request)
    {
        var userId = User.GetUserId();
        await _watchlistService.AddSymbolAsync(userId, symbol, request.CategoryId);
        return Ok();
    }

    [HttpDelete("symbols/{symbol}")]
    public async Task<ActionResult> RemoveFromWatchlist(string symbol)
    {
        var userId = User.GetUserId();
        await _watchlistService.RemoveSymbolAsync(userId, symbol);
        return Ok();
    }

    [HttpPost("categories")]
    public async Task<ActionResult<WatchlistCategoryDto>> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var userId = User.GetUserId();
        var category = await _watchlistService.CreateCategoryAsync(userId, request.Name, request.Color);
        return Ok(category);
    }
}
```

### 2. Search Service Implementation
```csharp
// File: Services/IStockSearchService.cs
public interface IStockSearchService
{
    Task<SearchResultDto> SearchAsync(string query, int limit, string[] sectors = null);
    Task<List<PopularStockDto>> GetPopularStocksAsync();
    Task<List<TrendingStockDto>> GetTrendingStocksAsync();
    Task<CompanyProfileDto> GetCompanyProfileAsync(string symbol);
    Task IndexStockDataAsync(); // For search optimization
}

// File: Services/StockSearchService.cs
public class StockSearchService : IStockSearchService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<StockSearchService> _logger;

    public async Task<SearchResultDto> SearchAsync(string query, int limit, string[] sectors = null)
    {
        var cacheKey = $"search_{query}_{limit}_{string.Join(",", sectors ?? Array.Empty<string>())}";
        
        if (_cache.TryGetValue(cacheKey, out SearchResultDto cachedResult))
            return cachedResult;

        // Normalize query for better matching
        var normalizedQuery = query.Trim().ToUpperInvariant();
        
        var stocks = await _context.Stocks
            .Where(s => 
                s.Symbol.Contains(normalizedQuery) ||
                s.CompanyName.Contains(normalizedQuery) ||
                EF.Functions.Like(s.CompanyName, $"%{normalizedQuery}%"))
            .Where(s => sectors == null || sectors.Contains(s.Sector))
            .OrderBy(s => 
                s.Symbol == normalizedQuery ? 0 :
                s.Symbol.StartsWith(normalizedQuery) ? 1 :
                s.CompanyName.StartsWith(normalizedQuery) ? 2 : 3)
            .ThenBy(s => s.Symbol)
            .Take(limit)
            .Select(s => new StockSearchResultDto
            {
                Symbol = s.Symbol,
                CompanyName = s.CompanyName,
                Sector = s.Sector,
                Industry = s.Industry,
                MarketCap = s.MarketCap,
                Exchange = s.Exchange,
                LogoUrl = s.LogoUrl,
                LastPrice = s.StockPrices.OrderByDescending(p => p.Date).FirstOrDefault().Close
            })
            .ToListAsync();

        var result = new SearchResultDto
        {
            Query = query,
            Results = stocks,
            TotalCount = stocks.Count
        };

        // Cache for 5 minutes
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(5));
        
        return result;
    }

    public async Task<CompanyProfileDto> GetCompanyProfileAsync(string symbol)
    {
        var cacheKey = $"profile_{symbol}";
        
        if (_cache.TryGetValue(cacheKey, out CompanyProfileDto cachedProfile))
            return cachedProfile;

        var stock = await _context.Stocks
            .Where(s => s.Symbol == symbol.ToUpper())
            .Select(s => new CompanyProfileDto
            {
                Symbol = s.Symbol,
                CompanyName = s.CompanyName,
                Sector = s.Sector,
                Industry = s.Industry,
                MarketCap = s.MarketCap,
                Exchange = s.Exchange,
                Description = s.Description,
                Website = s.Website,
                LogoUrl = s.LogoUrl,
                EmployeeCount = s.EmployeeCount,
                Founded = s.Founded,
                Headquarters = s.Headquarters,
                CEO = s.CEO
            })
            .FirstOrDefaultAsync();

        if (stock != null)
        {
            // Cache profile for 1 hour
            _cache.Set(cacheKey, stock, TimeSpan.FromHours(1));
        }

        return stock;
    }
}
```

### 3. Client-Side Search Component
```typescript
// File: components/Search/StockSearch.tsx
interface StockSearchProps {
  onSelectStock: (stock: StockSearchResult) => void;
  placeholder?: string;
  showRecent?: boolean;
  autoFocus?: boolean;
}

export const StockSearch: React.FC<StockSearchProps> = ({
  onSelectStock,
  placeholder = "Search stocks...",
  showRecent = true,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    data: searchResults,
    isLoading,
    error
  } = useStockSearch(query, { enabled: query.length >= 2 });

  const {
    data: recentSearches,
    addRecentSearch
  } = useRecentSearches();

  const {
    data: popularStocks
  } = usePopularStocks({ enabled: showRecent && !query });

  const displayResults = useMemo(() => {
    if (query.length >= 2) {
      return searchResults?.results || [];
    }
    if (showRecent && !query) {
      return [...(recentSearches || []), ...(popularStocks || [])];
    }
    return [];
  }, [query, searchResults, recentSearches, popularStocks, showRecent]);

  const handleSelect = useCallback((stock: StockSearchResult) => {
    onSelectStock(stock);
    addRecentSearch(stock);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onSelectStock, addRecentSearch]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < displayResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : displayResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && displayResults[selectedIndex]) {
          handleSelect(displayResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  }, [displayResults, selectedIndex, handleSelect]);

  return (
    <div className="stock-search-container">
      <div className="search-input-wrapper">
        <SearchIcon className="search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="search-input"
        />
        {isLoading && <LoadingSpinner className="search-loading" />}
      </div>

      {isOpen && (
        <div className="search-dropdown">
          {error && (
            <div className="search-error">
              Failed to search stocks. Please try again.
            </div>
          )}
          
          {displayResults.length === 0 && query.length >= 2 && !isLoading && (
            <div className="no-results">
              No stocks found for "{query}"
            </div>
          )}
          
          {displayResults.map((stock, index) => (
            <SearchResultItem
              key={stock.symbol}
              stock={stock}
              isSelected={index === selectedIndex}
              onClick={() => handleSelect(stock)}
              isRecent={recentSearches?.includes(stock)}
              isPopular={popularStocks?.includes(stock)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// File: components/Search/SearchResultItem.tsx
interface SearchResultItemProps {
  stock: StockSearchResult;
  isSelected: boolean;
  isRecent?: boolean;
  isPopular?: boolean;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  stock,
  isSelected,
  isRecent,
  isPopular,
  onClick
}) => {
  return (
    <div
      className={`search-result-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="stock-info">
        {stock.logoUrl && (
          <img src={stock.logoUrl} alt={stock.companyName} className="company-logo" />
        )}
        <div className="stock-details">
          <div className="symbol-name">
            <span className="symbol">{stock.symbol}</span>
            <span className="company-name">{stock.companyName}</span>
          </div>
          <div className="meta-info">
            <span className="sector">{stock.sector}</span>
            <span className="exchange">{stock.exchange}</span>
          </div>
        </div>
      </div>
      
      <div className="stock-price">
        {stock.lastPrice && (
          <span className="price">${stock.lastPrice.toFixed(2)}</span>
        )}
        {(isRecent || isPopular) && (
          <div className="badges">
            {isRecent && <span className="badge recent">Recent</span>}
            {isPopular && <span className="badge popular">Popular</span>}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. Watchlist Management
```typescript
// File: components/Watchlist/WatchlistManager.tsx
export const WatchlistManager: React.FC = () => {
  const {
    data: watchlist,
    isLoading,
    refetch
  } = useUserWatchlist();

  const {
    data: categories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useWatchlistCategories();

  const {
    addToWatchlist,
    removeFromWatchlist,
    moveToCategory
  } = useWatchlistMutations();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const filteredStocks = useMemo(() => {
    if (!watchlist?.stocks) return [];
    
    if (selectedCategory === 'all') {
      return watchlist.stocks;
    }
    
    return watchlist.stocks.filter(stock => 
      stock.categoryId === selectedCategory
    );
  }, [watchlist, selectedCategory]);

  const handleAddStock = useCallback(async (stock: StockSearchResult) => {
    try {
      await addToWatchlist.mutateAsync({
        symbol: stock.symbol,
        categoryId: selectedCategory === 'all' ? null : selectedCategory
      });
      refetch();
    } catch (error) {
      console.error('Failed to add stock to watchlist:', error);
    }
  }, [addToWatchlist, selectedCategory, refetch]);

  return (
    <div className="watchlist-manager">
      <div className="watchlist-header">
        <h2>My Watchlist</h2>
        <StockSearch 
          onSelectStock={handleAddStock}
          placeholder="Add stock to watchlist..."
        />
      </div>

      <div className="watchlist-categories">
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onCreateCategory={() => setIsCreatingCategory(true)}
        />
      </div>

      <div className="watchlist-content">
        {isLoading ? (
          <WatchlistSkeleton />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="watchlist">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="stock-list"
                >
                  {filteredStocks.map((stock, index) => (
                    <Draggable
                      key={stock.symbol}
                      draggableId={stock.symbol}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <WatchlistItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          stock={stock}
                          isDragging={snapshot.isDragging}
                          onRemove={() => removeFromWatchlist.mutate(stock.symbol)}
                          onViewChart={() => {/* Navigate to chart */}}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {isCreatingCategory && (
        <CreateCategoryModal
          onClose={() => setIsCreatingCategory(false)}
          onSave={createCategory.mutateAsync}
        />
      )}
    </div>
  );
};
```

---

## 📁 File Structure
```
Apps/Api/
├── Controllers/
│   ├── StockSearchController.cs
│   └── WatchlistController.cs
├── Services/
│   ├── IStockSearchService.cs
│   ├── StockSearchService.cs
│   ├── IWatchlistService.cs
│   └── WatchlistService.cs
├── Models/
│   ├── SearchResultDto.cs
│   ├── CompanyProfileDto.cs
│   ├── WatchlistDto.cs
│   └── WatchlistCategory.cs
└── Data/
    └── WatchlistRepository.cs

apps/web/src/
├── components/
│   ├── Search/
│   │   ├── StockSearch.tsx
│   │   ├── SearchResultItem.tsx
│   │   └── SearchFilters.tsx
│   ├── Watchlist/
│   │   ├── WatchlistManager.tsx
│   │   ├── WatchlistItem.tsx
│   │   ├── CategoryTabs.tsx
│   │   └── CreateCategoryModal.tsx
├── hooks/
│   ├── useStockSearch.ts
│   ├── useUserWatchlist.ts
│   ├── useRecentSearches.ts
│   └── usePopularStocks.ts
├── services/
│   ├── SearchService.ts
│   └── WatchlistService.ts
└── types/
    ├── SearchTypes.ts
    └── WatchlistTypes.ts
```

---

## 🧪 Testing Strategy

### Search Functionality Tests
- [ ] Autocomplete performance (< 200ms)
- [ ] Fuzzy search accuracy
- [ ] Ranking algorithm validation
- [ ] Cache effectiveness

### Watchlist Tests
- [ ] Add/remove stock operations
- [ ] Category management
- [ ] Drag and drop functionality
- [ ] Data persistence

### Integration Tests
- [ ] Search to watchlist flow
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Offline behavior

---

## 🚀 Implementation Phases

### Phase 1: Basic Search (Week 1)
- [ ] Implement basic stock search API
- [ ] Create search component with autocomplete
- [ ] Add company profile lookup
- [ ] Basic search result display

### Phase 2: Enhanced Search (Week 2)
- [ ] Add search filters and sorting
- [ ] Implement caching and optimization
- [ ] Add recent searches and popular stocks
- [ ] Improve search relevance ranking

### Phase 3: Watchlist Core (Week 3)
- [ ] Create watchlist management API
- [ ] Build watchlist UI components
- [ ] Add/remove functionality
- [ ] Basic category support

### Phase 4: Advanced Features (Week 4)
- [ ] Drag and drop reordering
- [ ] Bulk operations
- [ ] Watchlist sharing
- [ ] Mobile optimization

---

## 📈 Performance Targets
- Search response time: < 200ms
- Autocomplete suggestions: < 100ms
- Watchlist load time: < 500ms
- Search index size: < 100MB
- Support 10,000+ symbols

---

## 🔗 Dependencies
- **Prerequisites**: Story 1.1 (Database) for stock data
- **Integration**: Story 2.1 (Charts) for symbol selection
- **Enhancement**: Story 4.2 (Portfolio) for investment tracking
