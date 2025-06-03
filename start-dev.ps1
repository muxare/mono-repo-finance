#!/usr/bin/env pwsh

Write-Host "🚀 Starting MonoRepo Development Environment..." -ForegroundColor Green

# Clean up any existing port files
$portFile = "apps/api-ports.json"
if (Test-Path $portFile) {
    Remove-Item $portFile -Force
}

# Start the API in background
Write-Host "📡 Starting .NET API..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location "apps/api/Api"
    dotnet run --launch-profile https
}

# Wait for the API to start and write port information
Write-Host "⏳ Waiting for API to start..." -ForegroundColor Yellow
$timeout = 30
$elapsed = 0
while (-not (Test-Path $portFile) -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 1
    $elapsed++
    Write-Host "." -NoNewline -ForegroundColor Gray
}
Write-Host ""

if (-not (Test-Path $portFile)) {
    Write-Host "❌ Failed to start API within timeout" -ForegroundColor Red
    Stop-Job $apiJob
    Remove-Job $apiJob
    exit 1
}

# Read port information
$portInfo = Get-Content $portFile | ConvertFrom-Json
$httpsUrl = $portInfo.httpsUrl
$httpUrl = $portInfo.httpUrl

Write-Host "✅ API started successfully!" -ForegroundColor Green
Write-Host "   HTTPS: $httpsUrl" -ForegroundColor Cyan
Write-Host "   HTTP: $httpUrl" -ForegroundColor Cyan

# Extract port from HTTPS URL
$httpsPort = ([System.Uri]$httpsUrl).Port
$httpPort = ([System.Uri]$httpUrl).Port

# Update frontend environment variables
$envFile = "apps/web/.env"
$envContent = @"
# API Configuration (Auto-generated)
VITE_API_BASE_URL=$httpsUrl/api
VITE_API_BASE_URL_HTTP=$httpUrl/api
"@

Write-Output $envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "📝 Updated frontend configuration" -ForegroundColor Yellow

# Update Vite config
$viteConfigContent = @"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: '$httpsUrl',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      },
    },
  },
})
"@

Write-Output $viteConfigContent | Out-File -FilePath "apps/web/vite.config.ts" -Encoding UTF8

# Start the frontend
Write-Host "🎨 Starting React frontend..." -ForegroundColor Yellow
Set-Location "apps/web"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location "apps/web"
    npm run dev
}

Write-Host ""
Write-Host "🎉 Development environment started!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   API: $httpsUrl" -ForegroundColor Cyan
Write-Host "   Swagger: $httpsUrl/swagger" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow

# Wait for user interrupt
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if jobs are still running
        if ($apiJob.State -eq "Failed" -or $apiJob.State -eq "Completed") {
            Write-Host "❌ API job stopped unexpectedly" -ForegroundColor Red
            break
        }
        if ($frontendJob.State -eq "Failed" -or $frontendJob.State -eq "Completed") {
            Write-Host "❌ Frontend job stopped unexpectedly" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host "`n🛑 Stopping development environment..." -ForegroundColor Yellow
} finally {
    # Clean up
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    
    # Kill any remaining processes
    Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "dotnet" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Development environment stopped" -ForegroundColor Green
}
