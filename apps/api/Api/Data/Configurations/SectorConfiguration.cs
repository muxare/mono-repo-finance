using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Api.Models.Entities;

namespace Api.Data.Configurations;

public class SectorConfiguration : IEntityTypeConfiguration<Sector>
{
    public void Configure(EntityTypeBuilder<Sector> builder)
    {
        builder.ToTable("Sectors");
        
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(150);
            
        builder.Property(s => s.Description)
            .HasMaxLength(500);
            
        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
            
        builder.Property(s => s.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
        
        // Indexes
        builder.HasIndex(s => s.Name)
            .IsUnique()
            .HasDatabaseName("IX_Sector_Name");
        
        // Relationships
        builder.HasMany(s => s.Stocks)
            .WithOne(st => st.Sector)
            .HasForeignKey(st => st.SectorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
