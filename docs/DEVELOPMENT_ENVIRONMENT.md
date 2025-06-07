# Development Environment Management

This document explains how to robustly manage the MonoRepo development environment and avoid common process management issues.

## The Problem

When running `pnpm run dev` from the monorepo root, you may encounter:
- ❌ **File locks** on `Api.exe` preventing builds
- ❌ **Port conflicts** from previous sessions
- ❌ **Orphaned processes** not cleaned up properly
- ❌ **Inconsistent startup** requiring manual process killing

## The Solution: Robust Development Manager

We've created a comprehensive development manager that automatically handles:
- ✅ **Process cleanup** before starting
- ✅ **Port conflict detection** and resolution
- ✅ **Graceful shutdown** handling
- ✅ **Status monitoring** and diagnostics

## Quick Start

### Option 1: Use the Development Manager (Recommended)

```powershell
# Start development environment (with automatic cleanup)
pnpm run dev:start

# Check status of running processes
pnpm run dev:status

# Stop all development processes
pnpm run dev:stop

# Restart environment (force cleanup + start)
pnpm run dev:restart
```

### Option 2: Direct Script Access

```powershell
# Full control with the PowerShell script
.\scripts\dev-manager.ps1 start           # Start with cleanup
.\scripts\dev-manager.ps1 stop -Force     # Force stop all processes
.\scripts\dev-manager.ps1 restart -Force  # Force restart
.\scripts\dev-manager.ps1 status          # Show detailed status
.\scripts\dev-manager.ps1 clean           # Clean up without starting
.\scripts\dev-manager.ps1 help            # Show help
```

### Option 3: Windows Command Prompt

```cmd
# Use the batch wrapper
dev.cmd start
dev.cmd stop
dev.cmd status
```

## Commands Reference

| Command | Description | Use Case |
|---------|-------------|----------|
| `pnpm run dev:start` | Clean + Start | Daily development start |
| `pnpm run dev:stop` | Stop all processes | End of development session |
| `pnpm run dev:restart` | Force restart | When something goes wrong |
| `pnpm run dev:status` | Check process status | Troubleshooting |
| `pnpm run dev` | Traditional start | When you know it's clean |

## What Gets Cleaned Up

The development manager automatically identifies and stops:

### Processes
- **API processes**: `Api.exe`, `dotnet.exe`
- **Web processes**: `node.exe` (Vite dev server)
- **Port-blocking processes**: Any process using development ports

### Ports
- **API ports**: `5044` (HTTP), `7002` (HTTPS)
- **Web ports**: `5173-5177` (Vite auto-assigns)

## Troubleshooting

### "Port already in use" errors
```powershell
# Check what's using ports
pnpm run dev:status

# Clean up and restart
pnpm run dev:restart
```

### "File is locked" errors
```powershell
# Force clean all processes
.\scripts\dev-manager.ps1 clean -Force

# Then start normally
pnpm run dev:start
```

### Check running processes manually
```powershell
# See all development-related processes
Get-Process | Where-Object {$_.ProcessName -match "Api|dotnet|node"}

# See what's using specific ports
netstat -ano | findstr ":5044 :7002 :5173"
```

## Best Practices

### ✅ Do
- Use `pnpm run dev:start` for daily development
- Use `pnpm run dev:stop` when finishing work
- Check `pnpm run dev:status` if something seems wrong
- Use `pnpm run dev:restart` to fix stuck processes

### ❌ Don't
- Use `Ctrl+C` to stop processes (doesn't always clean up properly)
- Kill processes manually unless emergency
- Run multiple `pnpm run dev` sessions simultaneously
- Ignore port conflict warnings

## Advanced Configuration

### Customizing Process Detection

Edit `scripts\dev-manager.ps1` to modify:

```powershell
# Add/remove process names to monitor
$ApiProcessNames = @("Api", "dotnet", "YourCustomProcess")

# Add/remove ports to check
$ApiPorts = @(5044, 7002, 8080)
$WebPorts = @(5173, 5174, 5175, 5176, 5177, 3000)
```

### Environment-Specific Settings

You can create environment-specific versions:

```powershell
# For CI/CD environments
.\scripts\dev-manager.ps1 start -SkipCleanup

# For development with external dependencies
.\scripts\dev-manager.ps1 start -Force
```

## Integration with IDEs

### Visual Studio Code
Add to `.vscode/tasks.json`:

```json
{
    "label": "Start Dev Environment",
    "type": "shell",
    "command": "pnpm",
    "args": ["run", "dev:start"],
    "group": "build",
    "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
    }
}
```

### JetBrains Rider
Add run configuration:
- **Program**: `pnpm`
- **Arguments**: `run dev:start`
- **Working directory**: `$ProjectFileDir$`

## Migration from Old Workflow

If you were previously using:

```powershell
# Old way (problematic)
pnpm run dev

# When it failed
Get-Process Api | Stop-Process -Force
pnpm run dev
```

Now use:

```powershell
# New way (robust)
pnpm run dev:start
```

The new workflow automatically handles all the cleanup that you used to do manually.
