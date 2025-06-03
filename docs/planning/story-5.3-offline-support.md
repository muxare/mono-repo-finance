# Story 5.3: Offline Support

## Story Overview
**As a** user  
**I want** basic functionality when offline or with poor connectivity  
**So that** I can view cached financial data and continue working without internet access

## Epic
Epic 5: Real-time Data & Performance

## Priority
Medium

## Story Points
8

## Dependencies
- Story 1.2: Financial Data API Endpoints (for data structure understanding)
- Story 5.1: Real-time Price Updates (for offline/online state management)
- Story 5.2: Performance Optimization (for caching strategies)

---

## Acceptance Criteria

### AC 5.3.1: Service Worker Implementation
**Given** I access the application  
**When** the service worker is installed  
**Then** critical app assets should be cached for offline access  
**And** the app should work without network connectivity  
**And** cached resources should be updated in the background  
**And** users should be notified of available updates

### AC 5.3.2: Offline Data Caching
**Given** I have previously viewed stock data while online  
**When** I go offline and access the same data  
**Then** cached stock information should be displayed  
**And** data should include last known prices and basic details  
**And** charts should render with cached historical data  
**And** cached data should be clearly marked as "Last updated: [timestamp]"

### AC 5.3.3: Offline Indicator in UI
**Given** I am using the application  
**When** my internet connection is lost  
**Then** a clear offline indicator should appear in the UI  
**And** real-time features should be disabled gracefully  
**And** available offline features should remain functional  
**And** I should be notified when connection is restored

### AC 5.3.4: Background Synchronization
**Given** I perform actions while offline  
**When** my connection is restored  
**Then** the app should sync any cached changes automatically  
**And** conflicts should be resolved appropriately  
**And** I should be notified of successful synchronization  
**And** failed sync attempts should be retried

### AC 5.3.5: Graceful Feature Degradation
**Given** I am offline  
**When** I try to access real-time features  
**Then** features should degrade gracefully with helpful messages  
**And** offline-capable features should remain fully functional  
**And** search should work with cached data  
**And** navigation should work without network calls

---

## Technical Implementation

### Phase 1: Service Worker Setup (Week 1)
**Objective**: Implement service worker for offline capabilities

**Tasks:**
- Create service worker with caching strategies
- Implement install and update lifecycle management
- Add cache versioning and cleanup
- Create offline page and error handling
- Add service worker registration and updates

**Files to Create/Modify:**
```
apps/web/public/sw.js
apps/web/src/utils/serviceWorker.ts
apps/web/src/hooks/useServiceWorker.ts
apps/web/src/components/ServiceWorker/UpdatePrompt.tsx
apps/web/src/pages/Offline.tsx
apps/web/vite.config.ts (service worker plugin)
```

**Service Worker Strategy:**
```javascript
// Cache-first for app shell
self.addEventListener('fetch', event => {
  if (event.request.destination === 'document') {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    )
  }
})

// Network-first for API calls with fallback
if (event.request.url.includes('/api/')) {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        const responseClone = response.clone()
        caches.open('api-cache').then(cache => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => caches.match(event.request))
  )
}
```

### Phase 2: Offline Data Management (Week 2)
**Objective**: Implement comprehensive offline data caching

**Tasks:**
- Create offline data storage using IndexedDB
- Implement data synchronization strategies
- Add cache expiration and cleanup policies
- Create offline-first data hooks
- Add data conflict resolution

**Files to Create/Modify:**
```
apps/web/src/services/offlineStorage.ts
apps/web/src/hooks/useOfflineData.ts
apps/web/src/utils/dataSync.ts
apps/web/src/contexts/OfflineContext.tsx
apps/web/src/services/conflictResolution.ts
apps/web/src/types/offline.ts
```

**Offline Storage Interface:**
```typescript
interface OfflineStorage {
  saveStock(symbol: string, data: StockData): Promise<void>
  getStock(symbol: string): Promise<StockData | null>
  savePriceHistory(symbol: string, data: PriceData[]): Promise<void>
  getPriceHistory(symbol: string): Promise<PriceData[]>
  saveWatchlist(watchlist: Watchlist): Promise<void>
  getWatchlists(): Promise<Watchlist[]>
  clearExpiredData(): Promise<void>
  getStorageInfo(): Promise<StorageInfo>
}
```

### Phase 3: UI Components for Offline State (Week 3)
**Objective**: Create user interface components for offline functionality

**Tasks:**
- Create offline indicator component
- Implement data staleness indicators
- Add offline feature messaging
- Create sync status indicators
- Implement update prompts and notifications

**Files to Create/Modify:**
```
apps/web/src/components/Offline/OfflineIndicator.tsx
apps/web/src/components/Offline/DataStalenessIndicator.tsx
apps/web/src/components/Offline/SyncStatus.tsx
apps/web/src/components/Offline/OfflineMessage.tsx
apps/web/src/hooks/useNetworkStatus.ts
apps/web/src/utils/offlineUIUtils.ts
```

**Offline UI Components:**
```tsx
const OfflineIndicator = () => {
  const { isOnline, isOffline } = useNetworkStatus()
  
  if (isOnline) return null
  
  return (
    <div className="offline-banner">
      <OfflineIcon />
      <span>You're offline. Showing cached data.</span>
      <button onClick={retryConnection}>Retry</button>
    </div>
  )
}

const DataStalenessIndicator = ({ lastUpdated }: { lastUpdated: Date }) => {
  const staleness = getStalenessLevel(lastUpdated)
  
  return (
    <div className={`staleness-indicator ${staleness}`}>
      Last updated: {formatRelativeTime(lastUpdated)}
    </div>
  )
}
```

### Phase 4: Background Sync and Conflict Resolution (Week 4)
**Objective**: Implement background synchronization and conflict handling

**Tasks:**
- Implement background sync for offline actions
- Create conflict resolution strategies
- Add retry mechanisms for failed syncs
- Implement optimistic updates
- Create sync queue management

**Files to Create/Modify:**
```
apps/web/src/services/backgroundSync.ts
apps/web/src/services/syncQueue.ts
apps/web/src/utils/conflictResolution.ts
apps/web/src/hooks/useBackgroundSync.ts
apps/web/src/components/Sync/SyncConflictResolver.tsx
```

**Background Sync Implementation:**
```typescript
interface SyncQueue {
  addToQueue(action: SyncAction): void
  processQueue(): Promise<void>
  retryFailedItems(): Promise<void>
  clearQueue(): void
  getQueueStatus(): SyncQueueStatus
}

interface SyncAction {
  id: string
  type: 'ADD_TO_WATCHLIST' | 'REMOVE_FROM_WATCHLIST' | 'UPDATE_SETTINGS'
  payload: any
  timestamp: Date
  retryCount: number
}
```

---

## Offline Capabilities Matrix

### Available Offline Features
```
✅ View cached stock lists
✅ View cached stock details
✅ View cached price charts
✅ Search cached stocks
✅ Navigate between pages
✅ View cached watchlists
✅ Access user preferences
✅ View cached news articles

❌ Real-time price updates
❌ Live chart updates
❌ Add new stocks to watch
❌ Fetch latest news
❌ Real-time notifications
❌ Share functionality
❌ Export fresh data
```

### Cache Storage Strategy
```
App Shell (Service Worker Cache):
├─ HTML files
├─ CSS files
├─ JavaScript bundles
├─ Static assets
└─ Offline page

Data Cache (IndexedDB):
├─ Stock information
├─ Price history (last 30 days)
├─ Watchlists
├─ User preferences
├─ Cached news articles
└─ Chart configurations
```

---

## Network Status Management

### Connection Detection
```typescript
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<ConnectionType>()
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Detect connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType)
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return { isOnline, isOffline: !isOnline, connectionType }
}
```

### Smart Caching Strategies
- **Critical Data**: Cache immediately and keep indefinitely
- **Stock Prices**: Cache for 1 hour, update in background
- **News Articles**: Cache for 24 hours
- **Chart Data**: Cache for 6 hours with compression
- **User Data**: Cache indefinitely with sync on change

---

## Data Synchronization Patterns

### Optimistic Updates
```typescript
const useOptimisticWatchlist = () => {
  const [optimisticState, setOptimisticState] = useState<Watchlist>()
  const { mutate, isLoading, error } = useMutation(updateWatchlist, {
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['watchlist'])
      
      // Snapshot previous value
      const previousWatchlist = queryClient.getQueryData(['watchlist'])
      
      // Optimistically update
      queryClient.setQueryData(['watchlist'], newData)
      setOptimisticState(newData)
      
      return { previousWatchlist }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist'], context.previousWatchlist)
      }
    }
  })
}
```

### Conflict Resolution Strategies
1. **Last Writer Wins**: Simple timestamp-based resolution
2. **User Choice**: Prompt user to resolve conflicts
3. **Field-Level Merging**: Merge non-conflicting changes
4. **Automatic Merging**: Smart merge based on data type

---

## Storage Management

### IndexedDB Schema
```typescript
interface OfflineDatabase {
  stocks: {
    symbol: string // Primary key
    data: StockData
    lastUpdated: Date
    expiresAt: Date
  }
  
  priceHistory: {
    id: string // symbol-timeframe combination
    symbol: string
    timeframe: string
    data: PriceData[]
    lastUpdated: Date
  }
  
  watchlists: {
    id: string
    name: string
    stocks: string[]
    lastModified: Date
    synced: boolean
  }
  
  syncQueue: {
    id: string
    action: SyncAction
    status: 'pending' | 'processing' | 'failed'
    retryCount: number
    createdAt: Date
  }
}
```

### Storage Quotas and Management
```typescript
const getStorageEstimate = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      quota: estimate.quota,
      usage: estimate.usage,
      available: estimate.quota - estimate.usage,
      usagePercentage: (estimate.usage / estimate.quota) * 100
    }
  }
}

const cleanupOldData = async () => {
  const db = await openDatabase()
  const now = new Date()
  
  // Remove expired cache entries
  await db.stocks.where('expiresAt').below(now).delete()
  await db.priceHistory.where('lastUpdated').below(
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days
  ).delete()
}
```

---

## Testing Offline Functionality

### Offline Testing Strategy
```typescript
describe('Offline Functionality', () => {
  beforeEach(() => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })
  })
  
  test('displays cached stock data when offline', async () => {
    // Pre-populate cache
    await offlineStorage.saveStock('AAPL', mockStockData)
    
    // Simulate offline state
    server.use(
      rest.get('/api/stocks/AAPL', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )
    
    render(<StockDetail symbol="AAPL" />)
    
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText(/cached data/i)).toBeInTheDocument()
  })
  
  test('queues actions for background sync', async () => {
    const action = { type: 'ADD_TO_WATCHLIST', payload: { symbol: 'AAPL' } }
    
    await syncQueue.addToQueue(action)
    
    expect(await syncQueue.getQueueStatus()).toHaveLength(1)
  })
})
```

### Network Simulation
- **Chrome DevTools**: Network throttling and offline simulation
- **Playwright**: Network condition testing
- **Jest**: Mock network states
- **MSW**: Mock service worker for API responses

---

## Progressive Web App Features

### PWA Manifest
```json
{
  "name": "Finance Screener",
  "short_name": "FinScreen",
  "description": "Comprehensive financial data analysis tool",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "offline_enabled": true
}
```

### Installation Prompt
```typescript
const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  
  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstallable(false)
      }
    }
  }
  
  return { isInstallable, install }
}
```

---

## Definition of Done

### Completion Criteria
- [ ] All acceptance criteria are met
- [ ] Service worker implemented and functional
- [ ] Offline data caching working properly
- [ ] UI indicators for offline state implemented
- [ ] Background sync functional
- [ ] Conflict resolution implemented
- [ ] PWA features working
- [ ] Offline testing completed
- [ ] Performance impact minimal
- [ ] Cross-browser compatibility verified
- [ ] Documentation updated
- [ ] Code review completed

### Success Metrics
- App works offline for core features
- Cache hit rate >90% for previously viewed data
- Service worker cache size <10MB
- Offline state clearly communicated to users
- Background sync success rate >95%
- PWA installation works on supported devices
