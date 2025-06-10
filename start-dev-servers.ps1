# Start both frontend and backend dev servers
# Frontend will start through Turborepo (includes all shared packages)
# Backend will start separately due to .NET path issues

Write-Host "Starting MonoRepo Development Servers..." -ForegroundColor Green
Write-Host "Frontend + Shared Packages: http://localhost:5175" -ForegroundColor Cyan  
Write-Host "Backend API: https://localhost:7003" -ForegroundColor Cyan
Write-Host ""

# Start frontend and shared packages via Turborepo (excludes api)
Write-Host "Starting frontend and shared packages..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm turbo dev --filter=!api"

# Wait a moment then start API separately
Start-Sleep 3
Write-Host "Starting backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\apps\api\Api'; dotnet run --launch-profile https"

Write-Host ""
Write-Host "Both servers are starting in separate windows..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5175" -ForegroundColor Cyan
Write-Host "Backend:  https://localhost:7003" -ForegroundColor Cyan
