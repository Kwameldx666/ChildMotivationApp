using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Models;

namespace NotificationService.Infrastructure.Persistence;

public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<StoredNotification> Notifications { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<StoredNotification>(entity =>
        {
            entity.ToTable("notifications");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(e => e.Type)
                .HasColumnName("type")
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(e => e.Title)
                .HasColumnName("title")
                .IsRequired()
                .HasMaxLength(512);

            entity.Property(e => e.Message)
                .HasColumnName("message")
                .IsRequired()
                .HasMaxLength(2048);

            entity.Property(e => e.IsRead)
                .HasColumnName("is_read")
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at");

            entity.Property(e => e.Data)
                .HasColumnName("data")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => v == null ? null : JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => v == null
                        ? null
                        : JsonSerializer.Deserialize<Dictionary<string, object>>(v, JsonSerializerOptions.Default));

            entity.HasIndex(e => e.UserId).HasDatabaseName("ix_notifications_user_id");
            entity.HasIndex(e => new { e.UserId, e.IsRead }).HasDatabaseName("ix_notifications_user_id_is_read");
            entity.HasIndex(e => e.CreatedAt).HasDatabaseName("ix_notifications_created_at");
        });
    }
}
