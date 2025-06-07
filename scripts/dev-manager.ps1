#!/usr/bin/env pwsh
# MonoRepo Development Manager
# Robust development environment management with automatic cleanup

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "clean", "help")]
    [string]$Action = "start",
    
    [switch]$Force,
    [switch]$SkipCleanup
)

# Configuration
$ApiProcessNames = @("Api", "dotnet")
$WebProcessNames = @("node")
$ApiPorts = @(5044, 7002)
$WebPorts = @(5173, 5174, 5175, 5176, 5177)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "🚀 MonoRepo Development Manager" "Green"
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" "Yellow"
    Write-ColorOutput "  .\scripts\dev-manager.ps1 [action] [options]" "Cyan"
    Write-ColorOutput ""
    Write-ColorOutput "ACTIONS:" "Yellow"
    Write-ColorOutput "  start     - Clean up and start development environment (default)" "White"
    Write-ColorOutput "  stop      - Stop all development processes" "White"
    Write-ColorOutput "  restart   - Stop and start development environment" "White"
    Write-ColorOutput "  status    - Show current process status" "White"
    Write-ColorOutput "  clean     - Clean up processes and ports without starting" "White"
    Write-ColorOutput "  help      - Show this help message" "White"
    Write-ColorOutput ""
    Write-ColorOutput "OPTIONS:" "Yellow"
    Write-ColorOutput "  -Force        - Force kill processes without confirmation" "White"
    Write-ColorOutput "  -SkipCleanup  - Skip automatic cleanup on start" "White"
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-ColorOutput "  .\scripts\dev-manager.ps1                    # Start with cleanup" "Cyan"
    Write-ColorOutput "  .\scripts\dev-manager.ps1 restart -Force     # Force restart" "Cyan"
    Write-ColorOutput "  .\scripts\dev-manager.ps1 status             # Check status" "Cyan"
}

function Get-ProcessesByName {
    param([string[]]$ProcessNames)
    
    $processes = @()
    foreach ($name in $ProcessNames) {
        try {
            $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
            if ($procs) {
                $processes += $procs
            }
        }
        catch {
            # Process not found, continue
        }
    }
    return $processes
}

function Get-ProcessesUsingPorts {
    param([int[]]$Ports)
    
    $processes = @()
    foreach ($port in $Ports) {
        try {
            $netstat = netstat -ano | Select-String ":$port "            if ($netstat) {
                foreach ($line in $netstat) {
                    $processId = ($line.ToString().Split()[-1])
                    if ($processId -match '^\d+$') {
                        try {
                            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                            if ($proc -and $processes.Id -notcontains $proc.Id) {
                                $processes += $proc
                            }
                        }
                        catch {
                            # Process might have terminated
                        }
                    }
                }
            }
        }
        catch {
            # Port not in use or netstat failed
        }
    }
    return $processes
}

function Stop-DevelopmentProcesses {
    param([switch]$Force)
    
    Write-ColorOutput "🛑 Stopping development processes..." "Yellow"
    
    # Get all potentially conflicting processes
    $apiProcesses = Get-ProcessesByName -ProcessNames $ApiProcessNames
    $webProcesses = Get-ProcessesByName -ProcessNames $WebProcessNames
    $portProcesses = Get-ProcessesUsingPorts -Ports ($ApiPorts + $WebPorts)
    
    $allProcesses = @()
    $allProcesses += $apiProcesses
    $allProcesses += $webProcesses
    $allProcesses += $portProcesses
    
    # Remove duplicates
    $uniqueProcesses = $allProcesses | Sort-Object Id -Unique
    
    if ($uniqueProcesses.Count -eq 0) {
        Write-ColorOutput "✅ No development processes found running" "Green"
        return
    }
    
    Write-ColorOutput "Found $($uniqueProcesses.Count) processes to stop:" "White"
    foreach ($proc in $uniqueProcesses) {
        Write-ColorOutput "  - $($proc.ProcessName) (PID: $($proc.Id))" "Gray"
    }
    
    if (-not $Force) {
        $response = Read-Host "Stop these processes? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-ColorOutput "❌ Operation cancelled" "Red"
            return $false
        }
    }
    
    $stopped = 0
    foreach ($proc in $uniqueProcesses) {
        try {
            Write-ColorOutput "Stopping $($proc.ProcessName) (PID: $($proc.Id))..." "Gray"
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            $stopped++
        }
        catch {
            Write-ColorOutput "⚠️  Failed to stop $($proc.ProcessName) (PID: $($proc.Id)): $($_.Exception.Message)" "Red"
        }
    }
    
    if ($stopped -gt 0) {
        Write-ColorOutput "⏳ Waiting for processes to terminate..." "Yellow"
        Start-Sleep -Seconds 3
    }
    
    Write-ColorOutput "✅ Stopped $stopped processes" "Green"
    return $true
}

function Show-ProcessStatus {
    Write-ColorOutput "📊 Development Environment Status" "Green"
    Write-ColorOutput ""
    
    # Check API processes
    $apiProcesses = Get-ProcessesByName -ProcessNames $ApiProcessNames
    Write-ColorOutput "API Processes:" "Yellow"
    if ($apiProcesses.Count -eq 0) {
        Write-ColorOutput "  ✅ No API processes running" "Green"
    } else {
        foreach ($proc in $apiProcesses) {
            Write-ColorOutput "  🔶 $($proc.ProcessName) (PID: $($proc.Id)) - Started: $($proc.StartTime)" "Red"
        }
    }
    
    # Check web processes
    $webProcesses = Get-ProcessesByName -ProcessNames $WebProcessNames
    Write-ColorOutput "Web Processes:" "Yellow"
    if ($webProcesses.Count -eq 0) {
        Write-ColorOutput "  ✅ No web processes running" "Green"
    } else {
        foreach ($proc in $webProcesses) {
            Write-ColorOutput "  🔶 $($proc.ProcessName) (PID: $($proc.Id)) - Started: $($proc.StartTime)" "Red"
        }
    }
    
    # Check ports
    Write-ColorOutput "Port Usage:" "Yellow"
    $allPorts = $ApiPorts + $WebPorts
    $portsInUse = @()
    
    foreach ($port in $allPorts) {        $netstat = netstat -ano | Select-String ":$port " | Select-Object -First 1
        if ($netstat) {
            $portsInUse += $port
            $processId = ($netstat.ToString().Split()[-1])
            try {
                $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }
                Write-ColorOutput "  🔶 Port $port in use by $procName (PID: $processId)" "Red"
            }
            catch {
                Write-ColorOutput "  🔶 Port $port in use (PID: $processId)" "Red"
            }
        }
    }
    
    if ($portsInUse.Count -eq 0) {
        Write-ColorOutput "  ✅ All development ports are available" "Green"
    }
}

function Start-DevelopmentEnvironment {
    param([switch]$SkipCleanup)
    
    if (-not $SkipCleanup) {
        $cleaned = Stop-DevelopmentProcesses -Force
        if ($cleaned) {
            Write-ColorOutput "⏳ Waiting for cleanup to complete..." "Yellow"
            Start-Sleep -Seconds 2
        }
    }
    
    Write-ColorOutput "🚀 Starting development environment..." "Green"
    Write-ColorOutput ""
    Write-ColorOutput "Services will be available at:" "Yellow"
    Write-ColorOutput "  🌐 Frontend: http://localhost:5173-5177 (auto-assigned)" "Cyan"
    Write-ColorOutput "  🔗 API: https://localhost:7002 | http://localhost:5044" "Cyan"
    Write-ColorOutput "  📚 API Docs: https://localhost:7002/swagger" "Cyan"
    Write-ColorOutput ""
    Write-ColorOutput "Press Ctrl+C to stop all services" "Red"
    Write-ColorOutput ""
    
    # Start the development environment
    try {
        pnpm run dev
    }
    catch {
        Write-ColorOutput "❌ Failed to start development environment: $($_.Exception.Message)" "Red"
        Write-ColorOutput "💡 Try running: .\scripts\dev-manager.ps1 clean" "Yellow"
        exit 1
    }
}

# Main execution
switch ($Action.ToLower()) {
    "start" {
        Start-DevelopmentEnvironment -SkipCleanup:$SkipCleanup
    }
    "stop" {
        Stop-DevelopmentProcesses -Force:$Force
    }
    "restart" {
        Stop-DevelopmentProcesses -Force:$Force
        Start-Sleep -Seconds 2
        Start-DevelopmentEnvironment -SkipCleanup:$false
    }
    "status" {
        Show-ProcessStatus
    }
    "clean" {
        Stop-DevelopmentProcesses -Force:$Force
    }
    "help" {
        Show-Help
    }
    default {
        Write-ColorOutput "❌ Unknown action: $Action" "Red"
        Show-Help
        exit 1
    }
}
