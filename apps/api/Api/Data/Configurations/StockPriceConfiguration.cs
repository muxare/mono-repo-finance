using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Api.Models.Entities;

namespace Api.Data.Configurations;

public class StockPriceConfiguration : IEntityTypeConfiguration<StockPrice>
{
    public void Configure(EntityTypeBuilder<StockPrice> builder)
    {
        builder.ToTable("StockPrices");
        
        builder.HasKey(sp => sp.Id);
        
        builder.Property(sp => sp.Date)
            .IsRequired()
            .HasColumnType("date");
            
        builder.Property(sp => sp.Open)
            .IsRequired()
            .HasPrecision(18, 4);
            
        builder.Property(sp => sp.High)
            .IsRequired()
            .HasPrecision(18, 4);
            
        builder.Property(sp => sp.Low)
            .IsRequired()
            .HasPrecision(18, 4);
            
        builder.Property(sp => sp.Close)
            .IsRequired()
            .HasPrecision(18, 4);
            
        builder.Property(sp => sp.AdjustedClose)
            .HasPrecision(18, 4);
            
        builder.Property(sp => sp.Volume)
            .IsRequired();
            
        builder.Property(sp => sp.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
        
        // Indexes for time-series queries optimization
        builder.HasIndex(sp => new { sp.StockId, sp.Date })
            .IsUnique()
            .HasDatabaseName("IX_StockPrice_StockId_Date");
            
        builder.HasIndex(sp => sp.Date)
            .HasDatabaseName("IX_StockPrice_Date");
            
        // Covering index for common OHLCV queries
        builder.HasIndex(sp => new { sp.StockId, sp.Date })
            .IncludeProperties(sp => new { sp.Open, sp.High, sp.Low, sp.Close, sp.Volume })
            .HasDatabaseName("IX_StockPrice_StockId_Date_OHLCV");
        
        // Relationships
        builder.HasOne(sp => sp.Stock)
            .WithMany(s => s.Prices)
            .HasForeignKey(sp => sp.StockId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
