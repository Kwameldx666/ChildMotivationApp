using Microsoft.EntityFrameworkCore;
using ShopService.Domain.Entities;
using ShopService.Domain.Enums;

namespace ShopService.Persistence.Context;

public class ShopDbContext(DbContextOptions<ShopDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(b =>
        {
            b.ToTable("products");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.Description).HasMaxLength(2000);
            b.Property(x => x.Price).HasColumnType("numeric(12,2)").IsRequired();
            b.Property(x => x.Stock).HasDefaultValue(0);
            b.Property(x => x.IsActive).HasDefaultValue(true);
            b.Property(x => x.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<Order>(b =>
        {
            b.ToTable("orders");
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.Status).HasConversion<int>().HasDefaultValue(OrderStatus.Pending);
            b.Property(x => x.CreatedAt).IsRequired();
            b.Property(x => x.TotalAmount).HasColumnType("numeric(12,2)").IsRequired();

            b.HasMany(o => o.Items)
                .WithOne(i => i.Order)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(b =>
        {
            b.ToTable("order_items");
            b.HasKey(x => x.Id);
            b.Property(x => x.ProductName).HasMaxLength(200).IsRequired();
            b.Property(x => x.UnitPrice).HasColumnType("numeric(12,2)").IsRequired();
            b.Property(x => x.LineTotal).HasColumnType("numeric(12,2)").IsRequired();
            b.Property(x => x.Quantity).IsRequired();

            b.HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
