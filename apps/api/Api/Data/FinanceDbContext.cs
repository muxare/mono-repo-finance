using Microsoft.EntityFrameworkCore;
using Api.Models.Entities;
using Api.Data.Configurations;

namespace Api.Data;

/// <summary>
/// Entity Framework DbContext for the Finance Screener application
/// </summary>
public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options)
    {
    }

    // DbSets for each entity
    public DbSet<Stock> Stocks { get; set; }
    public DbSet<StockPrice> StockPrices { get; set; }
    public DbSet<Sector> Sectors { get; set; }
    public DbSet<Exchange> Exchanges { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations
        modelBuilder.ApplyConfiguration(new StockConfiguration());
        modelBuilder.ApplyConfiguration(new StockPriceConfiguration());
        modelBuilder.ApplyConfiguration(new SectorConfiguration());
        modelBuilder.ApplyConfiguration(new ExchangeConfiguration());        // Global query filters can be added here if needed in the future
        // modelBuilder.Entity<Stock>().HasQueryFilter(s => s.IsActive);
        
        // Additional database constraints and optimizations
        ApplyGlobalConstraints(modelBuilder);
    }

    /// <summary>
    /// Apply global database constraints and optimizations
    /// </summary>
    private static void ApplyGlobalConstraints(ModelBuilder modelBuilder)
    {
        // Ensure all string properties have reasonable max lengths if not specified
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(string) && property.GetMaxLength() == null)
                {
                    property.SetMaxLength(255); // Default max length for strings
                }
            }
        }
    }

    /// <summary>
    /// Override SaveChanges to automatically update UpdatedAt timestamps
    /// </summary>
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically update UpdatedAt timestamps
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Automatically update CreatedAt and UpdatedAt timestamps
    /// </summary>
    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        var utcNow = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.Entity is Stock stock)
            {
                if (entry.State == EntityState.Added)
                {
                    stock.CreatedAt = utcNow;
                }
                stock.UpdatedAt = utcNow;
            }
            else if (entry.Entity is Sector sector)
            {
                if (entry.State == EntityState.Added)
                {
                    sector.CreatedAt = utcNow;
                }
                sector.UpdatedAt = utcNow;
            }
            else if (entry.Entity is Exchange exchange)
            {
                if (entry.State == EntityState.Added)
                {
                    exchange.CreatedAt = utcNow;
                }
                exchange.UpdatedAt = utcNow;
            }
            else if (entry.Entity is StockPrice stockPrice && entry.State == EntityState.Added)
            {
                stockPrice.CreatedAt = utcNow;
            }
        }
    }
}
