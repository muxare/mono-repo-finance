@echo off
REM MonoRepo Development Environment Manager
REM Windows Batch wrapper for PowerShell script

setlocal enabledelayedexpansion

if "%~1"=="" (
    set "action=start"
) else (
    set "action=%~1"
)

set "scriptPath=%~dp0scripts\dev-manager.ps1"

REM Check if PowerShell is available
where pwsh >nul 2>&1
if %errorlevel% equ 0 (
    pwsh -ExecutionPolicy Bypass -File "%scriptPath%" %*
) else (
    powershell -ExecutionPolicy Bypass -File "%scriptPath%" %*
)
