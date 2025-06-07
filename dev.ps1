#!/usr/bin/env pwsh

# MonoRepo Development Helper Script

param(
    [Parameter(Position=0)]
    [ValidateSet("install", "dev", "build", "test", "clean", "api", "web", "help")]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "MonoRepo Development Commands:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  install   - Install all dependencies" -ForegroundColor Yellow
    Write-Host "  dev       - Start all applications in development mode" -ForegroundColor Yellow
    Write-Host "  build     - Build all applications" -ForegroundColor Yellow
    Write-Host "  test      - Run all tests" -ForegroundColor Yellow
    Write-Host "  clean     - Clean all build artifacts" -ForegroundColor Yellow
    Write-Host "  api       - Start only the .NET API" -ForegroundColor Yellow
    Write-Host "  web       - Start only the React web app" -ForegroundColor Yellow
    Write-Host "  help      - Show this help message" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Blue
    Write-Host "  ./dev.ps1 install" -ForegroundColor Cyan
    Write-Host "  ./dev.ps1 dev" -ForegroundColor Cyan
    Write-Host "  ./dev.ps1 api" -ForegroundColor Cyan
}

function Install-Dependencies {
    Write-Host "Installing dependencies..." -ForegroundColor Green
    pnpm install
    Write-Host "Dependencies installed!" -ForegroundColor Green
}

function Start-Development {
    Write-Host "Starting all applications in development mode..." -ForegroundColor Green
    Write-Host "API will be available at: http://localhost:5042" -ForegroundColor Yellow
    Write-Host "Web app will be available at: http://localhost:5173" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Red
    pnpm nx run-many --target=serve --projects=api,web --parallel
}

function Build-All {
    Write-Host "Building all applications..." -ForegroundColor Green
    pnpm nx run-many --target=build --all
    Write-Host "Build completed!" -ForegroundColor Green
}

function Test-All {
    Write-Host "Running all tests..." -ForegroundColor Green
    pnpm nx run-many --target=test --all
    Write-Host "Tests completed!" -ForegroundColor Green
}

function Clean-All {
    Write-Host "Cleaning all build artifacts..." -ForegroundColor Green
    pnpm nx reset
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/*/node_modules
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue libs/*/node_modules
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/api/Api/bin
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/api/Api/obj
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/web/dist
    Write-Host "Clean completed!" -ForegroundColor Green
}

function Start-API {
    Write-Host "Starting .NET API..." -ForegroundColor Green
    Write-Host "API will be available at: http://localhost:5042" -ForegroundColor Yellow
    pnpm nx serve api
}

function Start-Web {
    Write-Host "Starting React web app..." -ForegroundColor Green
    Write-Host "Web app will be available at: http://localhost:5173" -ForegroundColor Yellow
    pnpm nx serve web
}

# Main execution
switch ($Command) {
    "install" { Install-Dependencies }
    "dev" { Start-Development }
    "build" { Build-All }
    "test" { Test-All }
    "clean" { Clean-All }
    "api" { Start-API }
    "web" { Start-Web }
    "help" { Show-Help }
    default { Show-Help }
}
