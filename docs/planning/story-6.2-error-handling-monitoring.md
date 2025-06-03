# Story 6.2: Error Handling & Monitoring

## Story Overview
**As a** developer and user  
**I want** robust error handling and comprehensive monitoring  
**So that** issues are quickly identified, users receive helpful feedback, and system reliability is maintained

## Epic
Epic 6: Testing & Quality Assurance

## Priority
High

## Story Points
10

## Dependencies
- Story 1.2: Financial Data API Endpoints (for API error handling)
- Story 5.1: Real-time Price Updates (for WebSocket error handling)
- Story 6.1: Comprehensive Testing Suite (for error testing infrastructure)

---

## Acceptance Criteria

### AC 6.2.1: Global Error Boundaries in React
**Given** an unexpected error occurs in any React component  
**When** the error is thrown during rendering or lifecycle methods  
**Then** the error should be caught by an error boundary  
**And** a user-friendly error message should be displayed  
**And** the error should be logged for debugging  
**And** the rest of the application should remain functional

### AC 6.2.2: Structured Logging Throughout Application
**Given** the application is running  
**When** operations are performed or errors occur  
**Then** structured logs should be generated with consistent format  
**And** logs should include correlation IDs for request tracing  
**And** sensitive data should be excluded from logs  
**And** log levels should be appropriately assigned

### AC 6.2.3: Error Reporting and Monitoring Integration
**Given** errors occur in production  
**When** the error monitoring system processes them  
**Then** errors should be automatically reported to monitoring service  
**And** critical errors should trigger immediate alerts  
**And** error trends and patterns should be tracked  
**And** performance issues should be detected proactively

### AC 6.2.4: User-Friendly Error Messages
**Given** an error occurs during user interaction  
**When** the error is displayed to the user  
**Then** the message should be clear and actionable  
**And** technical details should be hidden from end users  
**And** appropriate fallback content should be shown  
**And** retry options should be provided where applicable

### AC 6.2.5: Automated Error Alerts and Escalation
**Given** critical errors are detected  
**When** error thresholds are exceeded  
**Then** automated alerts should be sent to the development team  
**And** escalation procedures should activate for high-severity issues  
**And** error recovery procedures should be documented  
**And** post-incident analysis should be facilitated

---

## Technical Implementation

### Phase 1: React Error Boundaries and Frontend Error Handling (Week 1)
**Objective**: Implement comprehensive frontend error handling

**Tasks:**
- Create global and component-level error boundaries
- Implement error fallback components
- Add error logging and reporting
- Create user-friendly error messages
- Implement error recovery mechanisms

**Files to Create/Modify:**
```
apps/web/src/components/ErrorBoundary/GlobalErrorBoundary.tsx
apps/web/src/components/ErrorBoundary/ChartErrorBoundary.tsx
apps/web/src/components/ErrorBoundary/ErrorFallback.tsx
apps/web/src/services/errorReporting.ts
apps/web/src/hooks/useErrorHandler.ts
apps/web/src/utils/errorUtils.ts
apps/web/src/types/errors.ts
```

**Error Boundary Implementation:**
```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Report error to monitoring service
    errorReporting.captureException(error, {
      extra: errorInfo,
      tags: { boundary: 'global' }
    })
    
    this.setState({ errorInfo })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }
    
    return this.props.children
  }
}
```

### Phase 2: Backend Error Handling and Logging (Week 2)
**Objective**: Implement structured logging and error handling in .NET API

**Tasks:**
- Configure Serilog for structured logging
- Implement global exception handling middleware
- Add request/response logging
- Create custom exception types
- Implement error response formatting

**Files to Create/Modify:**
```
apps/api/Api/Middleware/GlobalExceptionMiddleware.cs
apps/api/Api/Middleware/RequestLoggingMiddleware.cs
apps/api/Api/Exceptions/StockNotFoundException.cs
apps/api/Api/Exceptions/DataValidationException.cs
apps/api/Api/Models/ErrorResponse.cs
apps/api/Api/Extensions/LoggingExtensions.cs
apps/api/Program.cs (logging configuration)
```

**Global Exception Middleware:**
```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    
    public GlobalExceptionMiddleware(
        RequestDelegate next, 
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";
        
        var errorResponse = exception switch
        {
            StockNotFoundException => new ErrorResponse
            {
                StatusCode = 404,
                Message = "Stock not found",
                Details = exception.Message
            },
            DataValidationException => new ErrorResponse
            {
                StatusCode = 400,
                Message = "Validation error",
                Details = exception.Message
            },
            _ => new ErrorResponse
            {
                StatusCode = 500,
                Message = "An internal server error occurred",
                Details = "Please try again later"
            }
        };
        
        response.StatusCode = errorResponse.StatusCode;
        await response.WriteAsync(JsonSerializer.Serialize(errorResponse));
    }
}
```

### Phase 3: Error Monitoring and Alerting Integration (Week 3)
**Objective**: Integrate comprehensive error monitoring and alerting

**Tasks:**
- Integrate Sentry for error tracking
- Set up application performance monitoring
- Configure alert rules and notifications
- Implement error rate monitoring
- Create error dashboards and reports

**Files to Create/Modify:**
```
apps/web/src/config/sentry.ts
apps/api/Api/Services/IMonitoringService.cs
apps/api/Api/Services/SentryMonitoringService.cs
apps/web/src/hooks/useErrorReporting.ts
apps/web/src/utils/performanceMonitoring.ts
monitoring/alerts.yaml
```

**Sentry Configuration:**
```typescript
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false
    })
  ],
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.level === 'warning') return null
    return event
  }
})

// Performance monitoring
export const trackPageView = (pageName: string) => {
  Sentry.addBreadcrumb({
    message: `Page viewed: ${pageName}`,
    level: 'info',
    category: 'navigation'
  })
}

export const trackUserAction = (action: string, data?: any) => {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    level: 'info',
    category: 'user',
    data
  })
}
```

### Phase 4: Error Recovery and User Experience (Week 4)
**Objective**: Implement error recovery mechanisms and improve UX

**Tasks:**
- Create intelligent error recovery strategies
- Implement retry mechanisms with exponential backoff
- Add offline error handling
- Create error state management
- Implement graceful degradation

**Files to Create/Modify:**
```
apps/web/src/hooks/useRetry.ts
apps/web/src/hooks/useErrorRecovery.ts
apps/web/src/components/ErrorStates/NetworkError.tsx
apps/web/src/components/ErrorStates/ChartLoadError.tsx
apps/web/src/utils/retryUtils.ts
apps/web/src/contexts/ErrorContext.tsx
```

**Error Recovery Hook:**
```typescript
interface RetryOptions {
  maxAttempts: number
  backoffFactor: number
  onRetry?: (attempt: number) => void
  onMaxAttemptsReached?: () => void
}

export const useRetry = <T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    backoffFactor: 1000
  }
) => {
  const [isRetrying, setIsRetrying] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lastError, setLastError] = useState<Error | null>(null)
  
  const executeWithRetry = useCallback(async (): Promise<T> => {
    setIsRetrying(true)
    setLastError(null)
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        setAttempts(attempt)
        const result = await asyncFunction()
        setIsRetrying(false)
        setAttempts(0)
        return result
      } catch (error) {
        setLastError(error as Error)
        options.onRetry?.(attempt)
        
        if (attempt === options.maxAttempts) {
          options.onMaxAttemptsReached?.()
          setIsRetrying(false)
          throw error
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, options.backoffFactor * Math.pow(2, attempt - 1))
        )
      }
    }
    
    throw lastError
  }, [asyncFunction, options])
  
  return { executeWithRetry, isRetrying, attempts, lastError }
}
```

---

## Error Classification and Handling Strategy

### Error Categories
```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  PERMISSION_ERROR = 'permission_error',
  DATA_ERROR = 'data_error',
  CHART_ERROR = 'chart_error',
  REALTIME_ERROR = 'realtime_error',
  UNKNOWN_ERROR = 'unknown_error'
}

interface ApplicationError {
  type: ErrorType
  message: string
  code?: string
  statusCode?: number
  details?: any
  timestamp: Date
  userId?: string
  requestId?: string
  stack?: string
}
```

### Error Handling Matrix
```typescript
const errorHandlingStrategy = {
  [ErrorType.NETWORK_ERROR]: {
    userMessage: 'Connection problem. Please check your internet and try again.',
    showRetry: true,
    autoRetry: true,
    fallbackAction: 'show_cached_data'
  },
  [ErrorType.VALIDATION_ERROR]: {
    userMessage: 'Please check your input and try again.',
    showRetry: false,
    autoRetry: false,
    fallbackAction: 'highlight_invalid_fields'
  },
  [ErrorType.CHART_ERROR]: {
    userMessage: 'Unable to load chart. Showing alternative view.',
    showRetry: true,
    autoRetry: false,
    fallbackAction: 'show_data_table'
  },
  [ErrorType.REALTIME_ERROR]: {
    userMessage: 'Real-time updates unavailable. Data may be delayed.',
    showRetry: true,
    autoRetry: true,
    fallbackAction: 'switch_to_polling'
  }
}
```

---

## Logging Strategy

### Structured Logging Format
```csharp
// .NET Serilog configuration
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "FinanceScreener")
    .Enrich.WithProperty("Environment", environment)
    .WriteTo.Console(formatter: new JsonFormatter())
    .WriteTo.File(
        "logs/finance-screener-.txt",
        rollingInterval: RollingInterval.Day,
        formatter: new JsonFormatter()
    )
    .CreateLogger()

// Usage example
_logger.LogInformation(
    "Stock data retrieved for {Symbol} with {RecordCount} records in {Duration}ms",
    symbol, records.Count, stopwatch.ElapsedMilliseconds
)
```

### Frontend Logging
```typescript
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  userId?: string
  sessionId: string
  url: string
  userAgent: string
  extra?: Record<string, any>
}

class Logger {
  private static instance: Logger
  private sessionId: string = uuidv4()
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  info(message: string, extra?: Record<string, any>) {
    this.log('info', message, extra)
  }
  
  error(message: string, error?: Error, extra?: Record<string, any>) {
    this.log('error', message, { 
      ...extra, 
      stack: error?.stack,
      errorMessage: error?.message 
    })
  }
  
  private log(level: LogEntry['level'], message: string, extra?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      extra
    }
    
    // Send to logging service
    if (level === 'error') {
      Sentry.captureMessage(message, level)
    }
    
    console[level](entry)
  }
}
```

---

## Monitoring and Alerting

### Error Rate Monitoring
```typescript
interface ErrorMetrics {
  totalErrors: number
  errorRate: number
  errorsByType: Record<ErrorType, number>
  criticalErrors: number
  resolvedErrors: number
  averageResolutionTime: number
}

// Error rate calculation
const calculateErrorRate = (
  errors: ApplicationError[],
  totalRequests: number,
  timeWindow: number
): number => {
  const recentErrors = errors.filter(
    error => Date.now() - error.timestamp.getTime() < timeWindow
  )
  return (recentErrors.length / totalRequests) * 100
}
```

### Alert Configuration
```yaml
# Alert rules configuration
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    severity: "critical"
    notification:
      - email: "dev-team@company.com"
      - slack: "#alerts"
  
  - name: "Chart Loading Failures"
    condition: "chart_errors > 10 in 5m"
    severity: "warning"
    notification:
      - slack: "#frontend-team"
  
  - name: "API Response Time"
    condition: "avg_response_time > 2s"
    duration: "3m"
    severity: "warning"
```

### Health Check Endpoints
```csharp
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var health = new HealthStatus
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = _configuration["AppVersion"],
            Checks = new Dictionary<string, object>()
        };
        
        // Database connectivity check
        try
        {
            await _context.Database.CanConnectAsync();
            health.Checks["database"] = "Healthy";
        }
        catch (Exception ex)
        {
            health.Status = "Unhealthy";
            health.Checks["database"] = $"Unhealthy: {ex.Message}";
        }
        
        // External API check
        // Redis check
        // etc.
        
        return health.Status == "Healthy" ? Ok(health) : StatusCode(503, health);
    }
}
```

---

## User Experience Error Handling

### Error State Components
```tsx
const ChartErrorFallback: React.FC<{
  error: Error
  resetError: () => void
}> = ({ error, resetError }) => {
  const [isRetrying, setIsRetrying] = useState(false)
  
  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      resetError()
    } finally {
      setIsRetrying(false)
    }
  }
  
  return (
    <div className="error-fallback chart-error">
      <div className="error-icon">📊</div>
      <h3>Chart Unavailable</h3>
      <p>We're having trouble loading the chart. You can:</p>
      <div className="error-actions">
        <button 
          onClick={handleRetry} 
          disabled={isRetrying}
          className="retry-button"
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="refresh-button"
        >
          Refresh Page
        </button>
      </div>
      <details className="error-details">
        <summary>Technical Details</summary>
        <pre>{error.message}</pre>
      </details>
    </div>
  )
}
```

### Toast Notifications for Errors
```tsx
const useErrorToast = () => {
  const { toast } = useToast()
  
  const showError = useCallback((error: ApplicationError) => {
    const strategy = errorHandlingStrategy[error.type]
    
    toast({
      variant: 'destructive',
      title: 'Error',
      description: strategy.userMessage,
      action: strategy.showRetry ? (
        <Button onClick={() => retryLastAction()}>
          Retry
        </Button>
      ) : undefined
    })
  }, [toast])
  
  return { showError }
}
```

---

## Testing Error Scenarios

### Error Simulation for Testing
```typescript
// Mock error scenarios for testing
export const errorScenarios = {
  networkError: () => {
    throw new Error('Network request failed')
  },
  chartRenderError: () => {
    throw new Error('Chart failed to render')
  },
  dataValidationError: () => {
    throw new Error('Invalid data format')
  }
}

// Test error boundaries
describe('Error Boundary', () => {
  test('catches and displays component errors', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }
    
    render(
      <GlobalErrorBoundary>
        <ThrowError />
      </GlobalErrorBoundary>
    )
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
```

---

## Definition of Done

### Completion Criteria
- [ ] All acceptance criteria are met
- [ ] Global error boundaries implemented
- [ ] Structured logging configured
- [ ] Error monitoring service integrated
- [ ] User-friendly error messages created
- [ ] Automated alerting configured
- [ ] Error recovery mechanisms implemented
- [ ] Health check endpoints created
- [ ] Error testing completed
- [ ] Documentation updated
- [ ] Performance impact assessed
- [ ] Security review completed

### Success Metrics
- Error detection rate >95%
- Mean time to detection (MTTD) <5 minutes
- Mean time to resolution (MTTR) <30 minutes
- User-friendly error coverage >90%
- Zero unhandled exceptions in production
