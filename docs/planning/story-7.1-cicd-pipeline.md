# Story 7.1: CI/CD Pipeline

## Story Overview
**As a** developer  
**I want** automated CI/CD pipeline for building, testing, and deploying the application  
**So that** changes can be deployed safely and efficiently with minimal manual intervention

## Epic
Epic 7: Deployment & DevOps

## Priority
High

## Story Points
10

## Dependencies
- Story 6.1: Comprehensive Testing Suite (for automated testing in pipeline)
- Story 6.2: Error Handling & Monitoring (for deployment monitoring)
- All core application features (for deployment readiness)

---

## Acceptance Criteria

### AC 7.1.1: Automated Build and Test on Pull Requests
**Given** a pull request is created or updated  
**When** the CI pipeline is triggered  
**Then** the application should build successfully  
**And** all unit tests should pass  
**And** integration tests should pass  
**And** code quality checks should pass  
**And** build artifacts should be created

### AC 7.1.2: Staging Environment Deployment
**Given** code is merged to the main branch  
**When** the deployment pipeline runs  
**Then** the application should be automatically deployed to staging  
**And** database migrations should run automatically  
**And** environment-specific configurations should be applied  
**And** health checks should verify deployment success

### AC 7.1.3: Production Deployment with Rollback Capability
**Given** staging deployment is successful and approved  
**When** production deployment is triggered  
**Then** the application should deploy to production with zero downtime  
**And** database migrations should be applied safely  
**And** rollback capability should be available  
**And** deployment status should be monitored

### AC 7.1.4: Environment-Specific Configuration Management
**Given** different deployment environments exist  
**When** deployments occur  
**Then** environment-specific settings should be applied automatically  
**And** secrets should be managed securely  
**And** feature flags should be configurable per environment  
**And** configuration changes should not require code changes

### AC 7.1.5: Automated Database Migration Strategy
**Given** database schema changes are required  
**When** deployments include migrations  
**Then** migrations should run automatically and safely  
**And** rollback scripts should be available  
**And** migration status should be tracked  
**And** data integrity should be preserved

---

## Technical Implementation

### Phase 1: GitHub Actions CI/CD Setup (Week 1)
**Objective**: Implement comprehensive CI/CD workflows using GitHub Actions

**Tasks:**
- Create build and test workflows
- Set up matrix builds for multiple environments
- Configure artifact generation and storage
- Implement caching strategies
- Add workflow security and permissions

**Files to Create/Modify:**
```
.github/workflows/ci.yml
.github/workflows/cd-staging.yml
.github/workflows/cd-production.yml
.github/workflows/database-migration.yml
scripts/build.sh
scripts/test.sh
scripts/deploy.sh
```

**CI Workflow Configuration:**
```yaml
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  DOTNET_VERSION: '8.0'

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: apps/web/package-lock.json
    
    - name: Install dependencies
      working-directory: apps/web
      run: npm ci
    
    - name: Run linting
      working-directory: apps/web
      run: npm run lint
    
    - name: Run unit tests
      working-directory: apps/web
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: apps/web/coverage/lcov.info
        flags: frontend
        name: frontend-coverage
    
    - name: Build application
      working-directory: apps/web
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: frontend-build
        path: apps/web/dist/

  test-backend:
    runs-on: ubuntu-latest
    
    services:
      sqlserver:
        image: mcr.microsoft.com/mssql/server:2022-latest
        env:
          SA_PASSWORD: TestPassword123!
          ACCEPT_EULA: Y
        ports:
          - 1433:1433
        options: --health-cmd="/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P TestPassword123! -Q 'SELECT 1'" --health-interval=10s --health-timeout=5s --health-retries=3
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: ${{ env.DOTNET_VERSION }}
    
    - name: Restore dependencies
      working-directory: apps/api
      run: dotnet restore
    
    - name: Build
      working-directory: apps/api
      run: dotnet build --no-restore --configuration Release
    
    - name: Run tests
      working-directory: apps/api
      run: dotnet test --no-build --configuration Release --collect:"XPlat Code Coverage"
      env:
        ConnectionStrings__DefaultConnection: "Server=localhost;Database=FinanceScreenerTest;User Id=sa;Password=TestPassword123!;TrustServerCertificate=true"
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: apps/api/TestResults/*/coverage.cobertura.xml
        flags: backend
        name: backend-coverage

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend]
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true
    
    - name: Upload Playwright report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Phase 2: Docker Containerization (Week 2)
**Objective**: Create Docker containers for consistent deployments

**Tasks:**
- Create optimized Dockerfiles for frontend and backend
- Set up multi-stage builds
- Configure Docker Compose for local development
- Implement container health checks
- Set up container registry integration

**Files to Create/Modify:**
```
apps/web/Dockerfile
apps/api/Dockerfile
docker-compose.yml
docker-compose.prod.yml
.dockerignore
scripts/docker-build.sh
kubernetes/
```

**Frontend Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy project files
COPY ["Api/Api.csproj", "Api/"]
RUN dotnet restore "Api/Api.csproj"

# Copy source and build
COPY . .
WORKDIR "/src/Api"
RUN dotnet build "Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

ENTRYPOINT ["dotnet", "Api.dll"]
```

### Phase 3: Environment Configuration and Secrets Management (Week 3)
**Objective**: Implement secure configuration management across environments

**Tasks:**
- Set up environment-specific configuration files
- Implement secure secrets management
- Configure feature flags
- Set up environment validation
- Create configuration documentation

**Files to Create/Modify:**
```
config/development.json
config/staging.json
config/production.json
scripts/setup-env.sh
apps/api/Api/Configuration/EnvironmentConfig.cs
apps/web/src/config/environment.ts
.env.example
```

**Environment Configuration:**
```yaml
# CD Staging Workflow
name: Deploy to Staging

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_API: ${{ github.repository }}/api
  IMAGE_NAME_WEB: ${{ github.repository }}/web

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta-api
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API }}
        tags: |
          type=ref,event=branch
          type=sha,prefix={{branch}}-
    
    - name: Build and push API Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./apps/api
        push: true
        tags: ${{ steps.meta-api.outputs.tags }}
        labels: ${{ steps.meta-api.outputs.labels }}
    
    - name: Deploy to staging
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'finance-screener-staging'
        slot-name: 'production'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API }}:${{ github.sha }}
    
    - name: Run database migrations
      run: |
        dotnet tool install --global dotnet-ef
        dotnet ef database update --connection "${{ secrets.STAGING_CONNECTION_STRING }}"
      working-directory: apps/api
    
    - name: Health check
      run: |
        sleep 30
        curl -f https://finance-screener-staging.azurewebsites.net/health || exit 1
    
    - name: Notify deployment status
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Staging deployment ${{ job.status }}'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

### Phase 4: Production Deployment and Monitoring (Week 4)
**Objective**: Implement production deployment with monitoring and rollback

**Tasks:**
- Set up blue-green deployment strategy
- Implement deployment monitoring
- Create rollback procedures
- Set up post-deployment verification
- Configure deployment notifications

**Files to Create/Modify:**
```
.github/workflows/cd-production.yml
scripts/blue-green-deploy.sh
scripts/rollback.sh
scripts/post-deploy-verification.sh
monitoring/deployment-dashboard.json
```

**Production Deployment with Blue-Green Strategy:**
```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true
        default: 'latest'

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Green Slot
      id: deploy-green
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'finance-screener-prod'
        slot-name: 'green'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PROD }}
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_API }}:${{ github.event.inputs.version }}
    
    - name: Warm up Green Slot
      run: |
        sleep 60
        for i in {1..5}; do
          curl -f https://finance-screener-prod-green.azurewebsites.net/health
          sleep 10
        done
    
    - name: Run Production Smoke Tests
      run: |
        npm run test:smoke -- --baseUrl=https://finance-screener-prod-green.azurewebsites.net
    
    - name: Swap to Production
      if: success()
      uses: azure/CLI@v1
      with:
        inlineScript: |
          az webapp deployment slot swap \
            --name finance-screener-prod \
            --resource-group finance-screener-rg \
            --slot green \
            --target-slot production
    
    - name: Post-deployment verification
      run: |
        sleep 30
        curl -f https://finance-screener-prod.azurewebsites.net/health
        npm run test:smoke -- --baseUrl=https://finance-screener-prod.azurewebsites.net
    
    - name: Rollback on failure
      if: failure()
      uses: azure/CLI@v1
      with:
        inlineScript: |
          az webapp deployment slot swap \
            --name finance-screener-prod \
            --resource-group finance-screener-rg \
            --slot production \
            --target-slot green
```

---

## Database Migration Strategy

### Safe Migration Practices
```csharp
// Migration with rollback support
public partial class AddStockPriceIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Create index with online option for zero downtime
        migrationBuilder.Sql(@"
            CREATE NONCLUSTERED INDEX [IX_StockPrices_Symbol_Date] 
            ON [StockPrices] ([Symbol], [Date] DESC)
            INCLUDE ([Open], [High], [Low], [Close], [Volume])
            WITH (ONLINE = ON, MAXDOP = 1)
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_StockPrices_Symbol_Date",
            table: "StockPrices");
    }
}

// Migration verification script
public class MigrationVerification
{
    public static async Task<bool> VerifyMigration(ApplicationDbContext context)
    {
        try
        {
            // Test database connectivity
            await context.Database.CanConnectAsync();
            
            // Verify critical tables exist
            var stocks = await context.Stocks.Take(1).ToListAsync();
            
            // Verify indexes exist
            var indexExists = await context.Database
                .ExecuteSqlRawAsync("SELECT 1 FROM sys.indexes WHERE name = 'IX_StockPrices_Symbol_Date'");
            
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Migration verification failed: {ex.Message}");
            return false;
        }
    }
}
```

---

## Infrastructure as Code

### Terraform Configuration
```hcl
# Azure infrastructure
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
}

resource "azurerm_resource_group" "main" {
  name     = "finance-screener-rg"
  location = var.location
}

resource "azurerm_app_service_plan" "main" {
  name                = "finance-screener-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "Linux"
  reserved            = true

  sku {
    tier = "Standard"
    size = "S1"
  }
}

resource "azurerm_app_service" "api" {
  name                = "finance-screener-api"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  app_service_plan_id = azurerm_app_service_plan.main.id

  site_config {
    linux_fx_version = "DOCKER|${var.api_image}"
    always_on        = true
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "ConnectionStrings__DefaultConnection" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=ConnectionString)"
  }
}

resource "azurerm_app_service_slot" "green" {
  name                = "green"
  app_service_name    = azurerm_app_service.api.name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  app_service_plan_id = azurerm_app_service_plan.main.id

  site_config {
    linux_fx_version = "DOCKER|${var.api_image}"
  }
}
```

---

## Monitoring and Alerting

### Deployment Monitoring Dashboard
```json
{
  "dashboard": {
    "title": "Deployment Monitoring",
    "panels": [
      {
        "title": "Deployment Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(deployment_success_total[24h]) / rate(deployment_total[24h]) * 100"
          }
        ]
      },
      {
        "title": "Deployment Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, deployment_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Rollback Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(deployment_rollback_total[24h]) / rate(deployment_total[24h]) * 100"
          }
        ]
      }
    ]
  }
}
```

### Automated Rollback Triggers
```yaml
# Rollback conditions
rollback_triggers:
  - condition: "error_rate > 5%"
    duration: "5m"
    action: "automatic_rollback"
  
  - condition: "response_time_p95 > 2s"
    duration: "10m"
    action: "automatic_rollback"
  
  - condition: "health_check_failures > 3"
    duration: "2m"
    action: "automatic_rollback"
```

---

## Testing in CI/CD

### Pipeline Testing Strategy
```typescript
// Smoke tests for production deployment
describe('Production Smoke Tests', () => {
  test('API health check responds correctly', async () => {
    const response = await fetch(`${process.env.BASE_URL}/health`)
    expect(response.status).toBe(200)
    
    const health = await response.json()
    expect(health.status).toBe('Healthy')
  })
  
  test('Database connectivity works', async () => {
    const response = await fetch(`${process.env.BASE_URL}/api/stocks?page=1&pageSize=1`)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.items).toBeDefined()
  })
  
  test('Frontend loads correctly', async () => {
    const response = await fetch(process.env.BASE_URL)
    expect(response.status).toBe(200)
    
    const html = await response.text()
    expect(html).toContain('Finance Screener')
  })
})
```

---

## Security in CI/CD

### Security Scanning Integration
```yaml
# Security workflow
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run dependency vulnerability scan
      run: npm audit --audit-level=high
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/init@v2
      with:
        languages: javascript, csharp
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
```

---

## Definition of Done

### Completion Criteria
- [ ] All acceptance criteria are met
- [ ] CI workflow builds and tests on every PR
- [ ] Automated deployment to staging works
- [ ] Production deployment with blue-green strategy implemented
- [ ] Database migrations run automatically
- [ ] Environment-specific configurations managed
- [ ] Rollback capability tested and documented
- [ ] Security scanning integrated
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] Team training completed

### Success Metrics
- Build success rate >95%
- Deployment time <10 minutes
- Zero-downtime deployments achieved
- Rollback time <2 minutes
- Security scan pass rate 100%
- Mean time to deployment <1 hour
