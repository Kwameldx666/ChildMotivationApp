using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AuthService.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FamilyCode)
            .HasMaxLength(64);

        builder.Property(x => x.FamilyName)
            .HasMaxLength(128);

        builder.Property(x => x.FamilyEmblem)
            .HasMaxLength(128);

        builder.Property(x => x.UserStatus)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Avatar)
            .HasMaxLength(256);

        builder.Property(x => x.Age);

        builder.Property(x => x.UserType)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Name)
            .HasMaxLength(128);

        builder.Property(x => x.LastName)
            .HasMaxLength(128);
    }
}