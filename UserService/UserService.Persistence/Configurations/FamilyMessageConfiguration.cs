using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UserService.Domain.Entities;

namespace UserService.Persistence.Configurations;

public class FamilyMessageConfiguration : IEntityTypeConfiguration<FamilyMessage>
{
    public void Configure(EntityTypeBuilder<FamilyMessage> builder)
    {
        builder.ToTable("family_messages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.FamilyId)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(m => m.SenderId)
            .IsRequired();

        builder.Property(m => m.Content)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(m => m.CreatedAt)
            .IsRequired();

        builder.Property(m => m.IsRead)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(m => m.MentionedTaskId)
            .IsRequired(false);

        builder.Property(m => m.ReplyToMessageId)
            .IsRequired(false)
            .HasMaxLength(64);

        // Configure relationship with User
        builder.HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .HasPrincipalKey(u => u.Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.FamilyId);
        builder.HasIndex(m => new { m.FamilyId, m.CreatedAt });
        builder.HasIndex(m => m.MentionedTaskId);
    }
}
