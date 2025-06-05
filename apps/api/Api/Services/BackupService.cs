using Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Api.Services;

/// <summary>
/// Service for creating database backups before major import operations
/// </summary>
public interface IBackupService
{
    Task<string> CreateBackupAsync(string backupName = "");
    Task<bool> RestoreBackupAsync(string backupFilePath);
    Task<IEnumerable<string>> GetAvailableBackupsAsync();
    Task<bool> DeleteBackupAsync(string backupFilePath);
}

/// <summary>
/// Implementation of backup service for SQLite databases
/// </summary>
public class BackupService : IBackupService
{
    private readonly FinanceDbContext _context;
    private readonly ILogger<BackupService> _logger;
    private readonly string _backupDirectory;

    public BackupService(FinanceDbContext context, ILogger<BackupService> logger, IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _backupDirectory = configuration.GetValue<string>("BackupDirectory") 
            ?? Path.Combine(Directory.GetCurrentDirectory(), "Backups");
        
        // Ensure backup directory exists
        Directory.CreateDirectory(_backupDirectory);
    }

    /// <summary>
    /// Create a backup of the current database
    /// </summary>
    public async Task<string> CreateBackupAsync(string backupName = "")
    {
        try
        {            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss_fff");
            var fileName = string.IsNullOrEmpty(backupName) 
                ? $"backup_{timestamp}.db" 
                : $"{backupName}_{timestamp}.db";
            
            var backupFilePath = Path.Combine(_backupDirectory, fileName);

            // Get the current database file path
            var connectionString = _context.Database.GetConnectionString();
            var dbFilePath = ExtractDbFilePathFromConnectionString(connectionString);

            if (string.IsNullOrEmpty(dbFilePath) || !File.Exists(dbFilePath))
            {
                throw new InvalidOperationException("Database file not found or connection string invalid");
            }

            // Copy the database file
            await Task.Run(() => File.Copy(dbFilePath, backupFilePath, overwrite: false));

            _logger.LogInformation("Database backup created successfully: {BackupFilePath}", backupFilePath);
            
            return backupFilePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create database backup");
            throw;
        }
    }

    /// <summary>
    /// Restore database from backup file
    /// </summary>
    public async Task<bool> RestoreBackupAsync(string backupFilePath)
    {
        try
        {
            if (!File.Exists(backupFilePath))
            {
                _logger.LogError("Backup file not found: {BackupFilePath}", backupFilePath);
                return false;
            }

            var connectionString = _context.Database.GetConnectionString();
            var dbFilePath = ExtractDbFilePathFromConnectionString(connectionString);

            if (string.IsNullOrEmpty(dbFilePath))
            {
                _logger.LogError("Could not determine database file path from connection string");
                return false;
            }

            // Close all connections
            await _context.Database.CloseConnectionAsync();

            // Replace the current database with the backup
            await Task.Run(() => File.Copy(backupFilePath, dbFilePath, overwrite: true));

            _logger.LogInformation("Database restored successfully from: {BackupFilePath}", backupFilePath);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to restore database from backup: {BackupFilePath}", backupFilePath);
            return false;
        }
    }

    /// <summary>
    /// Get list of available backup files
    /// </summary>
    public async Task<IEnumerable<string>> GetAvailableBackupsAsync()
    {
        try
        {
            return await Task.Run(() => 
                Directory.GetFiles(_backupDirectory, "*.db")
                    .OrderByDescending(f => new FileInfo(f).CreationTime)
                    .ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available backups");
            return Enumerable.Empty<string>();
        }
    }

    /// <summary>
    /// Delete a backup file
    /// </summary>
    public async Task<bool> DeleteBackupAsync(string backupFilePath)
    {
        try
        {
            if (File.Exists(backupFilePath))
            {
                await Task.Run(() => File.Delete(backupFilePath));
                _logger.LogInformation("Backup file deleted: {BackupFilePath}", backupFilePath);
                return true;
            }
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete backup file: {BackupFilePath}", backupFilePath);
            return false;
        }
    }

    /// <summary>
    /// Extract database file path from SQLite connection string
    /// </summary>
    private string ExtractDbFilePathFromConnectionString(string connectionString)
    {
        if (string.IsNullOrEmpty(connectionString))
            return "";

        // Handle different SQLite connection string formats
        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var part in parts)
        {
            var keyValue = part.Split('=', 2);
            if (keyValue.Length == 2)
            {
                var key = keyValue[0].Trim().ToLowerInvariant();
                var value = keyValue[1].Trim();
                
                if (key == "data source" || key == "datasource")
                {
                    return value;
                }
            }
        }

        return "";
    }
}
