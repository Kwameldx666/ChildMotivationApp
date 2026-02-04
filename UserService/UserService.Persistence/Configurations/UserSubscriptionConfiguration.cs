using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UserService.Domain.Entities;

namespace UserService.Persistence.Configurations;

public class UserSubscriptionConfiguration : IEntityTypeConfiguration<UserSubscription>
{
    public void Configure(EntityTypeBuilder<UserSubscription> builder)
    {
        builder.ToTable("subscriptions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasColumnName("id");

        builder.Property(s => s.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(s => s.Tier)
            .HasColumnName("tier")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.StartDate)
            .HasColumnName("start_date")
            .IsRequired();

        builder.Property(s => s.EndDate)
            .HasColumnName("end_date");

        builder.Property(s => s.CancelledAt)
            .HasColumnName("cancelled_at");

        builder.Property(s => s.AutoRenew)
            .HasColumnName("auto_renew")
            .HasDefaultValue(true);

        builder.Property(s => s.PricePerMonth)
            .HasColumnName("price_per_month")
            .HasPrecision(10, 2);

        builder.Property(s => s.MaxChildren)
            .HasColumnName("max_children")
            .HasDefaultValue(2);

        builder.Property(s => s.MaxTasksPerDay)
            .HasColumnName("max_tasks_per_day")
            .HasDefaultValue(10);

        builder.Property(s => s.HasAIAssistant)
            .HasColumnName("has_ai_assistant")
            .HasDefaultValue(false);

        builder.Property(s => s.HasAdvancedAnalytics)
            .HasColumnName("has_advanced_analytics")
            .HasDefaultValue(false);

        builder.Property(s => s.HasCustomRewards)
            .HasColumnName("has_custom_rewards")
            .HasDefaultValue(false);

        builder.Property(s => s.HasPrioritySupport)
            .HasColumnName("has_priority_support")
            .HasDefaultValue(false);

        builder.Property(s => s.HasFamilySharing)
            .HasColumnName("has_family_sharing")
            .HasDefaultValue(false);

        builder.Property(s => s.HasOfflineMode)
            .HasColumnName("has_offline_mode")
            .HasDefaultValue(false);

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // Index by user_id for fast lookup
        builder.HasIndex(s => s.UserId)
            .IsUnique()
            .HasDatabaseName("ix_subscriptions_user_id");
    }
}
