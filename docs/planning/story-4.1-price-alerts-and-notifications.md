# Story 4.1: Price Alerts and Notifications

## 📋 Story Overview
**As a** trader/investor  
**I want** customizable price alerts and notifications  
**So that** I can be informed of important price movements without constantly monitoring the market

---

## 🎯 Acceptance Criteria

### Alert Types
- [ ] Price threshold alerts (above/below specific price)
- [ ] Percentage change alerts (daily/intraday movements)
- [ ] Volume spike alerts (unusual trading activity)
- [ ] Technical indicator alerts (RSI overbought/oversold, MA crossovers)
- [ ] Support/resistance level breaks

### Notification Channels
- [ ] In-app notifications with sound alerts
- [ ] Email notifications with customizable templates
- [ ] Push notifications for mobile devices
- [ ] SMS alerts for critical price movements
- [ ] Webhook/API integration for third-party systems

### Alert Management
- [ ] Create, edit, and delete alerts easily
- [ ] Enable/disable alerts temporarily
- [ ] Set alert expiration dates
- [ ] Organize alerts by priority levels
- [ ] Bulk alert operations

### Smart Features
- [ ] Machine learning price prediction alerts
- [ ] Market news correlation with price movements
- [ ] Alert fatigue prevention (smart grouping)
- [ ] Historical alert performance tracking
- [ ] Personalized alert suggestions

---

## 🛠️ Technical Implementation

### 1. Alert Management API
```csharp
// File: Controllers/AlertsController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;
    private readonly INotificationService _notificationService;

    [HttpGet]
    public async Task<ActionResult<List<AlertDto>>> GetUserAlerts(
        [FromQuery] bool includeTriggered = false,
        [FromQuery] AlertStatus? status = null)
    {
        var userId = User.GetUserId();
        var alerts = await _alertService.GetUserAlertsAsync(userId, includeTriggered, status);
        return Ok(alerts);
    }

    [HttpPost]
    public async Task<ActionResult<AlertDto>> CreateAlert([FromBody] CreateAlertRequest request)
    {
        var userId = User.GetUserId();
        var alert = await _alertService.CreateAlertAsync(userId, request);
        return CreatedAtAction(nameof(GetAlert), new { id = alert.Id }, alert);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AlertDto>> GetAlert(int id)
    {
        var userId = User.GetUserId();
        var alert = await _alertService.GetAlertAsync(id, userId);
        
        if (alert == null)
            return NotFound();
            
        return Ok(alert);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AlertDto>> UpdateAlert(int id, [FromBody] UpdateAlertRequest request)
    {
        var userId = User.GetUserId();
        var alert = await _alertService.UpdateAlertAsync(id, userId, request);
        
        if (alert == null)
            return NotFound();
            
        return Ok(alert);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAlert(int id)
    {
        var userId = User.GetUserId();
        var success = await _alertService.DeleteAlertAsync(id, userId);
        
        if (!success)
            return NotFound();
            
        return NoContent();
    }

    [HttpPost("{id}/test")]
    public async Task<ActionResult> TestAlert(int id)
    {
        var userId = User.GetUserId();
        await _notificationService.SendTestNotificationAsync(id, userId);
        return Ok();
    }

    [HttpPost("bulk")]
    public async Task<ActionResult> BulkOperation([FromBody] BulkAlertOperationRequest request)
    {
        var userId = User.GetUserId();
        await _alertService.BulkOperationAsync(userId, request);
        return Ok();
    }
}
```

### 2. Alert Processing Service
```csharp
// File: Services/IAlertService.cs
public interface IAlertService
{
    Task<AlertDto> CreateAlertAsync(string userId, CreateAlertRequest request);
    Task<List<AlertDto>> GetUserAlertsAsync(string userId, bool includeTriggered, AlertStatus? status);
    Task<AlertDto> GetAlertAsync(int alertId, string userId);
    Task<AlertDto> UpdateAlertAsync(int alertId, string userId, UpdateAlertRequest request);
    Task<bool> DeleteAlertAsync(int alertId, string userId);
    Task ProcessAlertsAsync(); // Background processing
    Task BulkOperationAsync(string userId, BulkAlertOperationRequest request);
}

// File: Services/AlertService.cs
public class AlertService : IAlertService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IMarketDataService _marketDataService;
    private readonly ILogger<AlertService> _logger;

    public async Task ProcessAlertsAsync()
    {
        var activeAlerts = await _context.Alerts
            .Where(a => a.Status == AlertStatus.Active)
            .Include(a => a.User)
            .ToListAsync();

        var tasks = activeAlerts.Select(async alert =>
        {
            try
            {
                var shouldTrigger = await EvaluateAlertCondition(alert);
                if (shouldTrigger)
                {
                    await TriggerAlert(alert);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing alert {AlertId}", alert.Id);
            }
        });

        await Task.WhenAll(tasks);
    }

    private async Task<bool> EvaluateAlertCondition(Alert alert)
    {
        var currentPrice = await _marketDataService.GetCurrentPriceAsync(alert.Symbol);
        
        return alert.AlertType switch
        {
            AlertType.PriceAbove => currentPrice.Close >= alert.TargetValue,
            AlertType.PriceBelow => currentPrice.Close <= alert.TargetValue,
            AlertType.PercentageChange => await EvaluatePercentageChange(alert, currentPrice),
            AlertType.VolumeSpike => await EvaluateVolumeSpike(alert, currentPrice),
            AlertType.TechnicalIndicator => await EvaluateTechnicalIndicator(alert, currentPrice),
            _ => false
        };
    }

    private async Task<bool> EvaluatePercentageChange(Alert alert, CurrentPrice currentPrice)
    {
        var referencePrice = alert.ReferencePrice ?? await GetReferencePriceAsync(alert);
        var changePercent = ((currentPrice.Close - referencePrice) / referencePrice) * 100;
        
        return Math.Abs(changePercent) >= alert.TargetValue;
    }

    private async Task<bool> EvaluateVolumeSpike(Alert alert, CurrentPrice currentPrice)
    {
        var averageVolume = await GetAverageVolumeAsync(alert.Symbol, 20); // 20-day average
        var volumeRatio = (double)currentPrice.Volume / averageVolume;
        
        return volumeRatio >= alert.TargetValue;
    }

    private async Task TriggerAlert(Alert alert)
    {
        alert.Status = AlertStatus.Triggered;
        alert.TriggeredAt = DateTimeOffset.UtcNow;
        alert.TriggerCount++;

        // Auto-disable if single-use alert
        if (!alert.IsRepeating)
        {
            alert.Status = AlertStatus.Disabled;
        }

        await _context.SaveChangesAsync();

        // Send notifications
        await _notificationService.SendAlertNotificationAsync(alert);

        _logger.LogInformation("Alert {AlertId} triggered for user {UserId}", alert.Id, alert.UserId);
    }
}
```

### 3. Notification Service
```csharp
// File: Services/INotificationService.cs
public interface INotificationService
{
    Task SendAlertNotificationAsync(Alert alert);
    Task SendTestNotificationAsync(int alertId, string userId);
    Task SendBulkNotificationAsync(List<Alert> alerts);
}

// File: Services/NotificationService.cs
public class NotificationService : INotificationService
{
    private readonly IEmailService _emailService;
    private readonly IPushNotificationService _pushService;
    private readonly ISmsService _smsService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public async Task SendAlertNotificationAsync(Alert alert)
    {
        var user = alert.User;
        var currentPrice = await GetCurrentPriceForAlert(alert);
        
        var notificationData = new AlertNotificationData
        {
            AlertId = alert.Id,
            Symbol = alert.Symbol,
            AlertType = alert.AlertType,
            TargetValue = alert.TargetValue,
            CurrentValue = GetCurrentValueForAlert(alert, currentPrice),
            TriggeredAt = alert.TriggeredAt.Value,
            Message = GenerateAlertMessage(alert, currentPrice)
        };

        // Send in-app notification via SignalR
        await _hubContext.Clients.User(user.Id)
            .SendAsync("AlertTriggered", notificationData);

        // Send other notification types based on user preferences
        var tasks = new List<Task>();

        if (user.EmailNotificationsEnabled && ShouldSendEmail(alert))
        {
            tasks.Add(_emailService.SendAlertEmailAsync(user.Email, notificationData));
        }

        if (user.PushNotificationsEnabled && ShouldSendPush(alert))
        {
            tasks.Add(_pushService.SendAlertPushAsync(user.Id, notificationData));
        }

        if (user.SmsNotificationsEnabled && ShouldSendSms(alert))
        {
            tasks.Add(_smsService.SendAlertSmsAsync(user.PhoneNumber, notificationData));
        }

        await Task.WhenAll(tasks);
        
        _logger.LogInformation("Sent alert notification for alert {AlertId}", alert.Id);
    }

    private string GenerateAlertMessage(Alert alert, CurrentPrice currentPrice)
    {
        return alert.AlertType switch
        {
            AlertType.PriceAbove => $"{alert.Symbol} has risen above ${alert.TargetValue:F2}. Current price: ${currentPrice.Close:F2}",
            AlertType.PriceBelow => $"{alert.Symbol} has fallen below ${alert.TargetValue:F2}. Current price: ${currentPrice.Close:F2}",
            AlertType.PercentageChange => $"{alert.Symbol} has moved {alert.TargetValue:F1}% or more. Current change: {currentPrice.ChangePercent:F2}%",
            AlertType.VolumeSpike => $"{alert.Symbol} is experiencing high volume ({currentPrice.Volume:N0} vs normal {alert.TargetValue:F1}x)",
            _ => $"Alert triggered for {alert.Symbol}"
        };
    }
}
```

### 4. Client-Side Alert Management
```typescript
// File: components/Alerts/AlertManager.tsx
export const AlertManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'triggered' | 'all'>('active');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);

  const {
    data: alerts,
    isLoading,
    refetch
  } = useUserAlerts({
    includeTriggered: activeTab !== 'active',
    status: activeTab === 'active' ? 'Active' : undefined
  });

  const {
    createAlert,
    updateAlert,
    deleteAlert,
    bulkOperation
  } = useAlertMutations();

  const handleCreateAlert = useCallback(async (alertData: CreateAlertData) => {
    try {
      await createAlert.mutateAsync(alertData);
      setIsCreating(false);
      refetch();
      toast.success('Alert created successfully');
    } catch (error) {
      toast.error('Failed to create alert');
    }
  }, [createAlert, refetch]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedAlerts.length === 0) return;
    
    try {
      await bulkOperation.mutateAsync({
        alertIds: selectedAlerts,
        operation: 'delete'
      });
      setSelectedAlerts([]);
      refetch();
      toast.success(`Deleted ${selectedAlerts.length} alerts`);
    } catch (error) {
      toast.error('Failed to delete alerts');
    }
  }, [selectedAlerts, bulkOperation, refetch]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    
    switch (activeTab) {
      case 'active':
        return alerts.filter(alert => alert.status === 'Active');
      case 'triggered':
        return alerts.filter(alert => alert.status === 'Triggered');
      default:
        return alerts;
    }
  }, [alerts, activeTab]);

  return (
    <div className="alert-manager">
      <div className="alert-header">
        <h2>Price Alerts</h2>
        <div className="alert-actions">
          {selectedAlerts.length > 0 && (
            <div className="bulk-actions">
              <button onClick={handleBulkDelete} className="btn-danger">
                Delete Selected ({selectedAlerts.length})
              </button>
              <button 
                onClick={() => setSelectedAlerts([])}
                className="btn-secondary"
              >
                Clear Selection
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary"
          >
            <PlusIcon /> Create Alert
          </button>
        </div>
      </div>

      <div className="alert-tabs">
        <TabButton
          active={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
        >
          Active ({alerts?.filter(a => a.status === 'Active').length || 0})
        </TabButton>
        <TabButton
          active={activeTab === 'triggered'}
          onClick={() => setActiveTab('triggered')}
        >
          Triggered ({alerts?.filter(a => a.status === 'Triggered').length || 0})
        </TabButton>
        <TabButton
          active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        >
          All ({alerts?.length || 0})
        </TabButton>
      </div>

      <div className="alert-list">
        {isLoading ? (
          <AlertListSkeleton />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState 
            title="No alerts found"
            description="Create your first price alert to get notified of important market movements"
            action={
              <button onClick={() => setIsCreating(true)} className="btn-primary">
                Create Alert
              </button>
            }
          />
        ) : (
          filteredAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              isSelected={selectedAlerts.includes(alert.id)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedAlerts(prev => [...prev, alert.id]);
                } else {
                  setSelectedAlerts(prev => prev.filter(id => id !== alert.id));
                }
              }}
              onEdit={(alert) => {/* Open edit modal */}}
              onDelete={() => deleteAlert.mutate(alert.id)}
              onTest={() => {/* Test alert */}}
            />
          ))
        )}
      </div>

      {isCreating && (
        <CreateAlertModal
          onClose={() => setIsCreating(false)}
          onSave={handleCreateAlert}
        />
      )}
    </div>
  );
};

// File: components/Alerts/CreateAlertModal.tsx
interface CreateAlertModalProps {
  onClose: () => void;
  onSave: (alert: CreateAlertData) => Promise<void>;
  symbol?: string; // Pre-populate if creating from chart
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  onClose,
  onSave,
  symbol: initialSymbol
}) => {
  const [formData, setFormData] = useState<CreateAlertData>({
    symbol: initialSymbol || '',
    alertType: 'PriceAbove',
    targetValue: 0,
    isRepeating: false,
    expirationDate: null,
    notificationChannels: ['InApp'],
    priority: 'Medium'
  });

  const {
    data: currentPrice,
    isLoading: priceLoading
  } = useCurrentPrice(formData.symbol, { enabled: !!formData.symbol });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Modal isOpen onClose={onClose} title="Create Price Alert">
      <form onSubmit={handleSubmit} className="create-alert-form">
        <div className="form-group">
          <label>Stock Symbol</label>
          <StockSearch
            value={formData.symbol}
            onSelectStock={(stock) => setFormData(prev => ({ ...prev, symbol: stock.symbol }))}
            placeholder="Search for a stock..."
          />
          {currentPrice && (
            <div className="current-price-info">
              Current price: ${currentPrice.close.toFixed(2)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Alert Type</label>
          <select
            value={formData.alertType}
            onChange={(e) => setFormData(prev => ({ ...prev, alertType: e.target.value as AlertType }))}
          >
            <option value="PriceAbove">Price Above</option>
            <option value="PriceBelow">Price Below</option>
            <option value="PercentageChange">Percentage Change</option>
            <option value="VolumeSpike">Volume Spike</option>
            <option value="TechnicalIndicator">Technical Indicator</option>
          </select>
        </div>

        <AlertTypeFields
          alertType={formData.alertType}
          targetValue={formData.targetValue}
          onTargetValueChange={(value) => setFormData(prev => ({ ...prev, targetValue: value }))}
          currentPrice={currentPrice?.close}
        />

        <div className="form-group">
          <label>Notification Channels</label>
          <NotificationChannelSelector
            selected={formData.notificationChannels}
            onChange={(channels) => setFormData(prev => ({ ...prev, notificationChannels: channels }))}
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isRepeating}
              onChange={(e) => setFormData(prev => ({ ...prev, isRepeating: e.target.checked }))}
            />
            Repeating Alert
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Alert
          </button>
        </div>
      </form>
    </Modal>
  );
};
```

---

## 📁 File Structure
```
Apps/Api/
├── Controllers/
│   └── AlertsController.cs
├── Services/
│   ├── IAlertService.cs
│   ├── AlertService.cs
│   ├── INotificationService.cs
│   └── NotificationService.cs
├── Models/
│   ├── Alert.cs
│   ├── AlertDto.cs
│   └── NotificationModels.cs
├── BackgroundJobs/
│   └── AlertProcessingJob.cs
└── Hubs/
    └── NotificationHub.cs

apps/web/src/
├── components/
│   ├── Alerts/
│   │   ├── AlertManager.tsx
│   │   ├── CreateAlertModal.tsx
│   │   ├── AlertItem.tsx
│   │   └── AlertTypeFields.tsx
│   └── Notifications/
│       ├── NotificationCenter.tsx
│       └── AlertNotification.tsx
├── hooks/
│   ├── useUserAlerts.ts
│   ├── useAlertMutations.ts
│   └── useNotifications.ts
├── services/
│   ├── AlertService.ts
│   └── NotificationService.ts
└── types/
    └── AlertTypes.ts
```

---

## 🧪 Testing Strategy

### Alert Processing Tests
- [ ] Alert condition evaluation accuracy
- [ ] Performance under high alert volume
- [ ] Race condition handling
- [ ] Database transaction integrity

### Notification Tests
- [ ] Multi-channel delivery verification
- [ ] Template rendering accuracy
- [ ] Delivery failure handling
- [ ] Rate limiting compliance

### Integration Tests
- [ ] End-to-end alert flow
- [ ] Real-time notification delivery
- [ ] Mobile push notification testing
- [ ] Email delivery confirmation

---

## 🚀 Implementation Phases

### Phase 1: Core Alert System (Week 1)
- [ ] Basic alert CRUD operations
- [ ] Simple price threshold alerts
- [ ] In-app notifications
- [ ] Alert processing background job

### Phase 2: Multiple Alert Types (Week 2)
- [ ] Percentage change alerts
- [ ] Volume spike detection
- [ ] Technical indicator alerts
- [ ] Alert management UI

### Phase 3: Notification Channels (Week 3)
- [ ] Email notifications with templates
- [ ] Push notifications
- [ ] SMS integration
- [ ] Webhook support

### Phase 4: Advanced Features (Week 4)
- [ ] Smart alert suggestions
- [ ] Alert performance analytics
- [ ] Bulk operations
- [ ] Mobile optimization

---

## 📈 Performance Targets
- Alert processing latency: < 10 seconds
- Support 1000+ alerts per user
- 99.9% notification delivery rate
- Handle 10,000+ concurrent alerts
- Sub-second in-app notifications

---

## 🔗 Dependencies
- **Prerequisites**: Story 2.2 (Real-time Data) for price updates
- **Integration**: Story 3.1 (Stock Search) for symbol selection
- **Enhancement**: Story 5.1 (Mobile App) for push notifications
