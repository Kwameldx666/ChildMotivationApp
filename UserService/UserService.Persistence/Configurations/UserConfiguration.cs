using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace UserService.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(x => x.Age);

        // Align enum storage with AuthService to keep AspNetUsers schema consistent across contexts
        builder.Property(x => x.UserType)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.UserStatus)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Avatar)
            .HasMaxLength(256);

        builder.Property(x => x.FamilyCode)
            .HasMaxLength(64);

        builder.Property(x => x.FamilyName)
            .HasMaxLength(128);

        builder.Property(x => x.FamilyEmblem)
            .HasMaxLength(128);

        builder.Property(x => x.Name)
            .HasMaxLength(128);

        builder.Property(x => x.LastName)
            .HasMaxLength(128);
    }
}
