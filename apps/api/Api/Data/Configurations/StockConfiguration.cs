using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Api.Models.Entities;

namespace Api.Data.Configurations;

public class StockConfiguration : IEntityTypeConfiguration<Stock>
{
    public void Configure(EntityTypeBuilder<Stock> builder)
    {
        builder.ToTable("Stocks");
        
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Symbol)
            .IsRequired()
            .HasMaxLength(20);
            
        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(s => s.Description)
            .HasMaxLength(2000);
            
        builder.Property(s => s.MarketCap)
            .HasPrecision(18, 2);
            
        builder.Property(s => s.OutstandingShares)
            .HasDefaultValue(null);
            
        builder.Property(s => s.IsActive)
            .IsRequired()
            .HasDefaultValue(true);
            
        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
            
        builder.Property(s => s.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
        
        // Indexes
        builder.HasIndex(s => s.Symbol)
            .HasDatabaseName("IX_Stock_Symbol");
            
        builder.HasIndex(s => new { s.Symbol, s.ExchangeId })
            .IsUnique()
            .HasDatabaseName("IX_Stock_Symbol_Exchange");
            
        builder.HasIndex(s => s.SectorId)
            .HasDatabaseName("IX_Stock_SectorId");
            
        builder.HasIndex(s => s.ExchangeId)
            .HasDatabaseName("IX_Stock_ExchangeId");
            
        builder.HasIndex(s => s.IsActive)
            .HasDatabaseName("IX_Stock_IsActive");
        
        // Relationships
        builder.HasOne(s => s.Sector)
            .WithMany(sec => sec.Stocks)
            .HasForeignKey(s => s.SectorId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne(s => s.Exchange)
            .WithMany(e => e.Stocks)
            .HasForeignKey(s => s.ExchangeId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(s => s.Prices)
            .WithOne(p => p.Stock)
            .HasForeignKey(p => p.StockId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
