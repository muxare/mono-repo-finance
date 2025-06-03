using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Api.Models.Entities;

namespace Api.Data.Configurations;

public class ExchangeConfiguration : IEntityTypeConfiguration<Exchange>
{
    public void Configure(EntityTypeBuilder<Exchange> builder)
    {
        builder.ToTable("Exchanges");
        
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(20);
            
        builder.Property(e => e.Country)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(e => e.Timezone)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
            
        builder.Property(e => e.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
        
        // Indexes
        builder.HasIndex(e => e.Code)
            .IsUnique()
            .HasDatabaseName("IX_Exchange_Code");
            
        builder.HasIndex(e => e.Name)
            .HasDatabaseName("IX_Exchange_Name");
        
        // Relationships
        builder.HasMany(e => e.Stocks)
            .WithOne(s => s.Exchange)
            .HasForeignKey(s => s.ExchangeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
