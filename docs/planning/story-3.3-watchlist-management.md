# Story 3.3: Watchlist Management

## Overview
**Epic**: Stock Screener Interface  
**Story**: Watchlist Management  
**Priority**: High  
**Estimated Effort**: 3 days  

## User Story
**As a** user  
**I want** to manage multiple stock watchlists  
**So that** I can organize and track different groups of stocks efficiently

## Acceptance Criteria

### Watchlist Operations
- [ ] **Create Watchlists**: Create new watchlists with custom names and descriptions
- [ ] **Rename/Edit**: Modify watchlist names, descriptions, and settings
- [ ] **Delete Watchlists**: Remove watchlists with confirmation dialog
- [ ] **Default Watchlist**: System-managed "My Watchlist" that cannot be deleted
- [ ] **Duplicate Protection**: Prevent duplicate stock entries within same watchlist

### Stock Management
- [ ] **Add Stocks**: Add stocks to watchlists via search or drag-and-drop
- [ ] **Remove Stocks**: Remove individual stocks or bulk remove selections
- [ ] **Move Between Lists**: Transfer stocks between different watchlists
- [ ] **Reorder Stocks**: Drag-and-drop to reorder stocks within watchlists
- [ ] **Bulk Operations**: Select multiple stocks for batch operations

### Watchlist Features
- [ ] **Performance Summary**: Overall portfolio performance and statistics
- [ ] **Sorting Options**: Sort by price, change %, volume, market cap, custom order
- [ ] **Filtering**: Filter stocks within watchlist by various criteria
- [ ] **Color Coding**: Visual indicators for different performance levels
- [ ] **Quick Actions**: Fast access to charts, news, and stock details

### Data Management
- [ ] **Export/Import**: Export watchlists to CSV/JSON, import from files
- [ ] **Sync Across Devices**: Cloud storage for watchlist synchronization
- [ ] **Backup/Restore**: Automatic backups with manual restore options
- [ ] **Sharing**: Share watchlists with other users (view-only links)
- [ ] **Privacy Controls**: Public/private watchlist settings

## Technical Implementation

### Component Structure
```
components/Watchlist/
├── WatchlistManager.tsx       # Main management interface
├── WatchlistGrid.tsx          # Grid view of all watchlists
├── WatchlistDetail.tsx        # Individual watchlist view
├── WatchlistCard.tsx          # Watchlist summary card
├── CreateWatchlistDialog.tsx  # New watchlist creation
├── EditWatchlistDialog.tsx    # Edit watchlist properties
├── WatchlistSettings.tsx      # Watchlist configuration
├── StockWatchlistItem.tsx     # Stock item in watchlist
├── WatchlistStats.tsx         # Performance statistics
├── ShareWatchlistDialog.tsx   # Share functionality
└── ImportExportDialog.tsx     # Data import/export
```

### Data Models
```typescript
interface Watchlist {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  stocks: WatchlistStock[];
  settings: WatchlistSettings;
  stats: WatchlistStats;
}

interface WatchlistStock {
  symbol: string;
  addedAt: string;
  position: number;
  notes?: string;
  targetPrice?: number;
  stopLoss?: number;
  quantity?: number;
  avgCost?: number;
}

interface WatchlistSettings {
  sortBy: 'symbol' | 'price' | 'change' | 'volume' | 'marketCap' | 'custom';
  sortDirection: 'asc' | 'desc';
  showSparklines: boolean;
  showMetrics: string[];
  refreshInterval: number;
  notifications: {
    priceAlerts: boolean;
    newsAlerts: boolean;
    volumeAlerts: boolean;
  };
}

interface WatchlistStats {
  totalStocks: number;
  totalValue?: number;
  totalChange: {
    absolute: number;
    percentage: number;
  };
  topGainer?: {
    symbol: string;
    change: number;
  };
  topLoser?: {
    symbol: string;
    change: number;
  };
  sectorDistribution: {
    sector: string;
    count: number;
    percentage: number;
  }[];
}
```

### Watchlist Manager Component
```typescript
interface WatchlistManagerProps {
  initialView?: 'grid' | 'detail';
  selectedWatchlistId?: string;
}

const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  initialView = 'grid',
  selectedWatchlistId,
}) => {
  const [view, setView] = useState<'grid' | 'detail'>(initialView);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(
    selectedWatchlistId || null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const {
    watchlists,
    loading,
    error,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    addStockToWatchlist,
    removeStockFromWatchlist,
    moveStock,
    reorderStocks,
  } = useWatchlistStore();

  const handleCreateWatchlist = async (data: CreateWatchlistData) => {
    try {
      const newWatchlist = await createWatchlist(data);
      setSelectedWatchlist(newWatchlist.id);
      setView('detail');
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Handle error
    }
  };

  const handleWatchlistSelect = (watchlistId: string) => {
    setSelectedWatchlist(watchlistId);
    setView('detail');
  };

  const handleBackToGrid = () => {
    setSelectedWatchlist(null);
    setView('grid');
  };

  if (loading && !watchlists.length) {
    return <WatchlistSkeleton />;
  }

  return (
    <div className="watchlist-manager">
      <div className="watchlist-header">
        <div className="header-content">
          <h1>My Watchlists</h1>
          <div className="header-actions">
            <button onClick={() => setIsImportDialogOpen(true)}>
              Import
            </button>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="primary"
            >
              Create Watchlist
            </button>
          </div>
        </div>
        
        {view === 'detail' && (
          <nav className="breadcrumb">
            <button onClick={handleBackToGrid}>Watchlists</button>
            <span>/</span>
            <span>{watchlists.find(w => w.id === selectedWatchlist)?.name}</span>
          </nav>
        )}
      </div>

      <div className="watchlist-content">
        {view === 'grid' ? (
          <WatchlistGrid
            watchlists={watchlists}
            onWatchlistSelect={handleWatchlistSelect}
            onWatchlistUpdate={updateWatchlist}
            onWatchlistDelete={deleteWatchlist}
          />
        ) : (
          <WatchlistDetail
            watchlistId={selectedWatchlist!}
            onBack={handleBackToGrid}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateWatchlistDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateWatchlist}
      />
      
      <ImportExportDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        mode="import"
      />
    </div>
  );
};
```

### Watchlist Detail Component
```typescript
interface WatchlistDetailProps {
  watchlistId: string;
  onBack: () => void;
}

const WatchlistDetail: React.FC<WatchlistDetailProps> = ({
  watchlistId,
  onBack,
}) => {
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [draggedStock, setDraggedStock] = useState<string | null>(null);

  const { watchlist, updateWatchlist, addStock, removeStock, reorderStocks } = 
    useWatchlistDetail(watchlistId);

  const handleStockSelect = (symbol: string, selected: boolean) => {
    const newSelection = new Set(selectedStocks);
    if (selected) {
      newSelection.add(symbol);
    } else {
      newSelection.delete(symbol);
    }
    setSelectedStocks(newSelection);
  };

  const handleBulkRemove = async () => {
    if (selectedStocks.size === 0) return;
    
    try {
      await Promise.all(
        Array.from(selectedStocks).map(symbol => removeStock(symbol))
      );
      setSelectedStocks(new Set());
    } catch (error) {
      // Handle error
    }
  };

  const handleDragStart = (symbol: string) => {
    setDraggedStock(symbol);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetSymbol: string) => {
    e.preventDefault();
    if (!draggedStock || draggedStock === targetSymbol) return;

    try {
      await reorderStocks(draggedStock, targetSymbol);
      setDraggedStock(null);
    } catch (error) {
      // Handle error
    }
  };

  if (!watchlist) {
    return <div>Watchlist not found</div>;
  }

  return (
    <div className="watchlist-detail">
      <div className="watchlist-detail-header">
        <div className="watchlist-info">
          <h2>{watchlist.name}</h2>
          {watchlist.description && (
            <p className="description">{watchlist.description}</p>
          )}
        </div>
        
        <div className="watchlist-actions">
          {selectedStocks.size > 0 && (
            <div className="bulk-actions">
              <span>{selectedStocks.size} selected</span>
              <button onClick={handleBulkRemove} className="danger">
                Remove Selected
              </button>
            </div>
          )}
          
          <button onClick={() => setIsEditDialogOpen(true)}>
            Edit Watchlist
          </button>
        </div>
      </div>

      <WatchlistStats stats={watchlist.stats} />

      <div className="watchlist-toolbar">
        <div className="sort-controls">
          <select
            value={watchlist.settings.sortBy}
            onChange={(e) => updateWatchlist({
              settings: {
                ...watchlist.settings,
                sortBy: e.target.value as any
              }
            })}
          >
            <option value="symbol">Symbol</option>
            <option value="price">Price</option>
            <option value="change">Change %</option>
            <option value="volume">Volume</option>
            <option value="marketCap">Market Cap</option>
            <option value="custom">Custom Order</option>
          </select>
          
          <button
            onClick={() => updateWatchlist({
              settings: {
                ...watchlist.settings,
                sortDirection: watchlist.settings.sortDirection === 'asc' ? 'desc' : 'asc'
              }
            })}
          >
            {watchlist.settings.sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <AddStockSearch
          onAddStock={(symbol) => addStock(symbol)}
          excludeSymbols={watchlist.stocks.map(s => s.symbol)}
        />
      </div>

      <div className="stocks-list">
        {watchlist.stocks.map((stock) => (
          <StockWatchlistItem
            key={stock.symbol}
            stock={stock}
            isSelected={selectedStocks.has(stock.symbol)}
            onSelect={(selected) => handleStockSelect(stock.symbol, selected)}
            onRemove={() => removeStock(stock.symbol)}
            onDragStart={() => handleDragStart(stock.symbol)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stock.symbol)}
            draggable={watchlist.settings.sortBy === 'custom'}
          />
        ))}
        
        {watchlist.stocks.length === 0 && (
          <div className="empty-watchlist">
            <p>No stocks in this watchlist yet.</p>
            <p>Use the search above to add stocks.</p>
          </div>
        )}
      </div>

      <EditWatchlistDialog
        open={isEditDialogOpen}
        watchlist={watchlist}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={updateWatchlist}
      />
    </div>
  );
};
```

### Stock Watchlist Item Component
```typescript
interface StockWatchlistItemProps {
  stock: WatchlistStock;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  draggable?: boolean;
}

const StockWatchlistItem: React.FC<StockWatchlistItemProps> = ({
  stock,
  isSelected,
  onSelect,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  draggable = false,
}) => {
  const [stockData, setStockData] = useState<StockOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    // Fetch real-time stock data
    const fetchStockData = async () => {
      try {
        const data = await stockApi.getStockOverview(stock.symbol);
        setStockData(data);
      } catch (error) {
        console.error(`Failed to fetch data for ${stock.symbol}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [stock.symbol]);

  const handleNotesUpdate = async (notes: string) => {
    try {
      await watchlistApi.updateStockNotes(stock.symbol, notes);
      // Update local state
    } catch (error) {
      // Handle error
    }
  };

  if (isLoading) {
    return <StockWatchlistItemSkeleton />;
  }

  if (!stockData) {
    return (
      <div className="stock-item error">
        <span>Failed to load {stock.symbol}</span>
        <button onClick={onRemove}>Remove</button>
      </div>
    );
  }

  return (
    <div
      className={`stock-watchlist-item ${isSelected ? 'selected' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="item-content">
        <div className="selection-area">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`Select ${stock.symbol}`}
          />
          {draggable && (
            <div className="drag-handle" aria-label="Drag to reorder">
              ⋮⋮
            </div>
          )}
        </div>

        <div className="stock-info">
          <div className="primary-info">
            <span className="symbol">{stockData.symbol}</span>
            <span className="name">{stockData.name}</span>
          </div>
          <div className="added-date">
            Added {new Date(stock.addedAt).toLocaleDateString()}
          </div>
        </div>

        <div className="price-info">
          <span className="current-price">
            ${stockData.currentPrice.toFixed(2)}
          </span>
          <PriceChange change={stockData.priceChange} size="small" />
        </div>

        <div className="metrics">
          <div className="metric">
            <span className="label">Volume</span>
            <span className="value">{formatVolume(stockData.metrics.volume)}</span>
          </div>
          <div className="metric">
            <span className="label">Market Cap</span>
            <span className="value">{formatMarketCap(stockData.metrics.marketCap)}</span>
          </div>
        </div>

        <div className="actions">
          <button onClick={() => setShowNotes(!showNotes)}>
            Notes {stock.notes && '●'}
          </button>
          <Link to={`/chart/${stock.symbol}`}>Chart</Link>
          <button onClick={onRemove} className="remove-button">
            ×
          </button>
        </div>
      </div>

      {showNotes && (
        <div className="notes-section">
          <textarea
            placeholder="Add notes about this stock..."
            defaultValue={stock.notes || ''}
            onBlur={(e) => handleNotesUpdate(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
```

## State Management

### Watchlist Store
```typescript
interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlist: string | null;
  loading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';
}

const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlists: [],
  activeWatchlist: null,
  loading: false,
  error: null,
  syncStatus: 'idle',

  // Actions
  loadWatchlists: async () => {
    set({ loading: true, error: null });
    try {
      const watchlists = await watchlistApi.getWatchlists();
      set({ watchlists, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createWatchlist: async (data: CreateWatchlistData) => {
    try {
      const newWatchlist = await watchlistApi.createWatchlist(data);
      set(state => ({
        watchlists: [...state.watchlists, newWatchlist]
      }));
      return newWatchlist;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateWatchlist: async (id: string, updates: Partial<Watchlist>) => {
    try {
      const updatedWatchlist = await watchlistApi.updateWatchlist(id, updates);
      set(state => ({
        watchlists: state.watchlists.map(w => 
          w.id === id ? updatedWatchlist : w
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteWatchlist: async (id: string) => {
    try {
      await watchlistApi.deleteWatchlist(id);
      set(state => ({
        watchlists: state.watchlists.filter(w => w.id !== id),
        activeWatchlist: state.activeWatchlist === id ? null : state.activeWatchlist
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  addStockToWatchlist: async (watchlistId: string, symbol: string) => {
    try {
      const updatedWatchlist = await watchlistApi.addStock(watchlistId, symbol);
      set(state => ({
        watchlists: state.watchlists.map(w => 
          w.id === watchlistId ? updatedWatchlist : w
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  removeStockFromWatchlist: async (watchlistId: string, symbol: string) => {
    try {
      const updatedWatchlist = await watchlistApi.removeStock(watchlistId, symbol);
      set(state => ({
        watchlists: state.watchlists.map(w => 
          w.id === watchlistId ? updatedWatchlist : w
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  reorderStocks: async (watchlistId: string, fromSymbol: string, toSymbol: string) => {
    try {
      const updatedWatchlist = await watchlistApi.reorderStocks(
        watchlistId, 
        fromSymbol, 
        toSymbol
      );
      set(state => ({
        watchlists: state.watchlists.map(w => 
          w.id === watchlistId ? updatedWatchlist : w
        )
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  exportWatchlist: async (watchlistId: string, format: 'csv' | 'json') => {
    try {
      const data = await watchlistApi.exportWatchlist(watchlistId, format);
      // Trigger download
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlist-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  importWatchlist: async (file: File) => {
    set({ loading: true });
    try {
      const importedWatchlist = await watchlistApi.importWatchlist(file);
      set(state => ({
        watchlists: [...state.watchlists, importedWatchlist],
        loading: false
      }));
      return importedWatchlist;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  syncWatchlists: async () => {
    set({ syncStatus: 'syncing' });
    try {
      const syncedWatchlists = await watchlistApi.syncWatchlists();
      set({ watchlists: syncedWatchlists, syncStatus: 'idle' });
    } catch (error) {
      set({ syncStatus: 'error', error: error.message });
    }
  },
}));
```

## API Endpoints

### Watchlist API
```typescript
// GET /api/watchlists
interface GetWatchlistsResponse {
  watchlists: Watchlist[];
  total: number;
}

// POST /api/watchlists
interface CreateWatchlistRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  settings?: Partial<WatchlistSettings>;
}

// PUT /api/watchlists/{id}
interface UpdateWatchlistRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  settings?: Partial<WatchlistSettings>;
}

// DELETE /api/watchlists/{id}
// Returns 204 No Content on success

// POST /api/watchlists/{id}/stocks
interface AddStockRequest {
  symbol: string;
  notes?: string;
  targetPrice?: number;
  stopLoss?: number;
}

// DELETE /api/watchlists/{id}/stocks/{symbol}
// Returns 204 No Content on success

// PUT /api/watchlists/{id}/stocks/reorder
interface ReorderStocksRequest {
  stockOrder: {
    symbol: string;
    position: number;
  }[];
}

// GET /api/watchlists/{id}/export?format=csv|json
// Returns file download

// POST /api/watchlists/import
// Accepts multipart/form-data with file
interface ImportWatchlistResponse {
  watchlist: Watchlist;
  errors?: string[];
}

// GET /api/watchlists/{id}/share
interface ShareWatchlistResponse {
  shareUrl: string;
  expiresAt: string;
}
```

## CSS Styles

### Watchlist Manager Styles
```css
.watchlist-manager {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.watchlist-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.breadcrumb button {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
}

/* Watchlist Grid */
.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.watchlist-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.watchlist-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.watchlist-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.watchlist-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.watchlist-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

.watchlist-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  display: block;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.watchlist-stocks-preview {
  margin: 1rem 0;
}

.stocks-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.stock-chip {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.stock-chip.positive {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.stock-chip.negative {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

/* Watchlist Detail */
.watchlist-detail {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 2rem;
}

.watchlist-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.watchlist-info h2 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.description {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.watchlist-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-warning-light);
  border-radius: 6px;
  font-size: 0.875rem;
}

.watchlist-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 8px;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-controls select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
}

/* Stock List Item */
.stock-watchlist-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  position: relative;
}

.stock-watchlist-item:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stock-watchlist-item.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.item-content {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 1rem;
}

.selection-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.drag-handle {
  cursor: grab;
  color: var(--color-text-secondary);
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.stock-info {
  flex: 1;
  min-width: 0;
}

.primary-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.symbol {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.name {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.added-date {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.current-price {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  min-width: 120px;
}

.metric {
  text-align: center;
}

.metric .label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.metric .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.actions button,
.actions a {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.actions button:hover,
.actions a:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.remove-button {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
}

.remove-button:hover {
  background: var(--color-danger) !important;
  border-color: var(--color-danger) !important;
}

.notes-section {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

.notes-section textarea {
  width: 100%;
  min-height: 60px;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
}

.empty-watchlist {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .watchlist-manager {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .watchlist-grid {
    grid-template-columns: 1fr;
  }
  
  .watchlist-toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .item-content {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .metrics {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .actions {
    width: 100%;
    justify-content: space-between;
  }
}

/* Drag and Drop */
.stock-watchlist-item.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.stock-watchlist-item.drag-over {
  border-color: var(--color-primary);
  border-style: dashed;
}

/* Loading States */
.watchlist-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.watchlist-card-skeleton {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-title {
  height: 1.5rem;
  background: var(--color-border);
  border-radius: 4px;
  margin-bottom: 1rem;
  width: 70%;
}

.skeleton-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
}

.skeleton-stat {
  height: 2rem;
  background: var(--color-border);
  border-radius: 4px;
}

.skeleton-stocks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skeleton-stock-chip {
  height: 1.5rem;
  width: 3rem;
  background: var(--color-border);
  border-radius: 16px;
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('WatchlistManager', () => {
  test('renders watchlist grid by default', () => {
    render(<WatchlistManager />);
    expect(screen.getByText('My Watchlists')).toBeInTheDocument();
    expect(screen.getByText('Create Watchlist')).toBeInTheDocument();
  });

  test('creates new watchlist', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Test Watchlist',
      stocks: []
    });
    
    useWatchlistStore.mockReturnValue({
      watchlists: [],
      createWatchlist: mockCreate,
    });

    render(<WatchlistManager />);
    
    fireEvent.click(screen.getByText('Create Watchlist'));
    
    const dialog = screen.getByRole('dialog');
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Watchlist' }
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Test Watchlist'
      });
    });
  });

  test('deletes watchlist with confirmation', async () => {
    const mockDelete = jest.fn().mockResolvedValue(undefined);
    const mockWatchlists = [{
      id: '1',
      name: 'Test Watchlist',
      stocks: [],
      isDefault: false
    }];

    useWatchlistStore.mockReturnValue({
      watchlists: mockWatchlists,
      deleteWatchlist: mockDelete,
    });

    render(<WatchlistManager />);
    
    fireEvent.click(screen.getByLabelText('Delete watchlist'));
    
    const confirmDialog = screen.getByRole('dialog');
    expect(confirmDialog).toHaveTextContent('Are you sure');
    
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1');
    });
  });
});

describe('WatchlistDetail', () => {
  const mockWatchlist = {
    id: '1',
    name: 'Tech Stocks',
    stocks: [
      { symbol: 'AAPL', addedAt: '2024-01-15', position: 0 },
      { symbol: 'MSFT', addedAt: '2024-01-16', position: 1 }
    ],
    settings: { sortBy: 'symbol', sortDirection: 'asc' }
  };

  test('renders watchlist stocks', () => {
    render(<WatchlistDetail watchlistId="1" onBack={jest.fn()} />);
    
    expect(screen.getByText('Tech Stocks')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
  });

  test('handles stock reordering via drag and drop', async () => {
    const mockReorder = jest.fn();
    
    render(<WatchlistDetail watchlistId="1" onBack={jest.fn()} />);
    
    const appleItem = screen.getByText('AAPL').closest('.stock-watchlist-item');
    const msftItem = screen.getByText('MSFT').closest('.stock-watchlist-item');
    
    fireEvent.dragStart(appleItem);
    fireEvent.dragOver(msftItem);
    fireEvent.drop(msftItem);

    await waitFor(() => {
      expect(mockReorder).toHaveBeenCalledWith('AAPL', 'MSFT');
    });
  });

  test('bulk removes selected stocks', async () => {
    const mockRemove = jest.fn();
    
    render(<WatchlistDetail watchlistId="1" onBack={jest.fn()} />);
    
    // Select both stocks
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Remove Selected'));

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Import/Export', () => {
  test('exports watchlist as CSV', async () => {
    const mockExport = jest.fn().mockResolvedValue('csv,data');
    
    render(<ExportDialog watchlistId="1" format="csv" />);
    
    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith('1', 'csv');
    });
  });

  test('imports watchlist from file', async () => {
    const mockImport = jest.fn().mockResolvedValue({
      id: '2',
      name: 'Imported Watchlist'
    });
    
    const file = new File(['test,data'], 'watchlist.csv', {
      type: 'text/csv'
    });

    render(<ImportDialog />);
    
    const input = screen.getByLabelText('Select file');
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText('Import'));

    await waitFor(() => {
      expect(mockImport).toHaveBeenCalledWith(file);
    });
  });
});
```

### Integration Tests
```typescript
describe('Watchlist Integration', () => {
  test('complete watchlist workflow', async () => {
    render(<WatchlistManager />);
    
    // Create watchlist
    fireEvent.click(screen.getByText('Create Watchlist'));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'My Stocks' }
    });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('My Stocks')).toBeInTheDocument();
    });

    // Open watchlist
    fireEvent.click(screen.getByText('My Stocks'));

    await waitFor(() => {
      expect(screen.getByText('Add stocks to get started')).toBeInTheDocument();
    });

    // Add stock
    const searchInput = screen.getByPlaceholderText('Search stocks...');
    fireEvent.change(searchInput, { target: { value: 'AAPL' } });
    fireEvent.click(screen.getByText('Apple Inc. (AAPL)'));

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Remove stock
    fireEvent.click(screen.getByLabelText('Remove AAPL'));

    await waitFor(() => {
      expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
    });
  });
});
```

## Performance Optimizations

### Virtual Scrolling for Large Watchlists
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedStockList = ({ stocks }: { stocks: WatchlistStock[] }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <StockWatchlistItem 
        stock={stocks[index]} 
        // ... other props
      />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={stocks.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Debounced Search
```typescript
const useDebounced = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AddStockSearch = ({ onAddStock }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query, 300);
  
  // Use debouncedQuery for API calls
};
```

### Optimistic Updates
```typescript
const optimisticAddStock = (watchlistId: string, symbol: string) => {
  // Immediately update UI
  set(state => ({
    watchlists: state.watchlists.map(w => 
      w.id === watchlistId 
        ? {
            ...w,
            stocks: [...w.stocks, {
              symbol,
              addedAt: new Date().toISOString(),
              position: w.stocks.length
            }]
          }
        : w
    )
  }));

  // Make API call and handle errors
  watchlistApi.addStock(watchlistId, symbol)
    .catch(error => {
      // Revert optimistic update
      revertAddStock(watchlistId, symbol);
      throw error;
    });
};
```

## Future Enhancements

### Phase 2 Features
- [ ] **Smart Lists**: Auto-updating watchlists based on criteria (e.g., "Top Gainers")
- [ ] **Collaboration**: Share watchlists with team members for editing
- [ ] **Templates**: Pre-built watchlist templates for different strategies
- [ ] **Mobile App**: Native mobile app with offline sync
- [ ] **Advanced Analytics**: Portfolio correlation analysis and risk metrics

### Advanced Features
- [ ] **AI Recommendations**: ML-powered stock suggestions based on watchlist patterns
- [ ] **Social Integration**: Follow other users' public watchlists
- [ ] **API Access**: RESTful API for third-party integrations
- [ ] **Webhook Notifications**: Real-time alerts via webhooks
- [ ] **Custom Metrics**: User-defined calculated fields and ratios

---

**Dependencies**: Stories 1.2 (API Endpoints), 3.1 (Stock Search), 3.2 (Stock Cards)  
**Blockers**: None  
**Definition of Done**: All acceptance criteria met, full test coverage, responsive design, data persistence working, import/export functional
