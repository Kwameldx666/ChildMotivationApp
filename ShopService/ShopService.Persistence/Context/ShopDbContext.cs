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
            
            // Premium поля
            b.Property(x => x.IsPremium).HasDefaultValue(false);
            b.Property(x => x.RequiredTier).HasMaxLength(50);
            b.Property(x => x.Category).HasMaxLength(100);
            b.Property(x => x.ImageUrl).HasMaxLength(500);
            b.Property(x => x.RecommendedAge);
            b.Property(x => x.IsExclusive).HasDefaultValue(false);
        });

        modelBuilder.Entity<Order>(b =>
        {
            b.ToTable("orders");
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.Status).HasConversion<int>().HasDefaultValue(OrderStatus.Pending);
            b.Property(x => x.CreatedAt).IsRequired();
            b.Property(x => x.TotalAmount).HasColumnType("numeric(12,2)").IsRequired();
            
            // Новые поля для подтверждения выдачи награды
            b.Property(x => x.DeliveredAt);
            b.Property(x => x.DeliveredByUserId).HasMaxLength(64);
            b.Property(x => x.ConfirmedAt);
            b.Property(x => x.ConfirmedByUserId).HasMaxLength(64);
            b.Property(x => x.DeliveryNotes).HasMaxLength(1000);

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

        SeedProducts(modelBuilder);
    }

    private static void SeedProducts(ModelBuilder modelBuilder)
    {
        var seedTimestamp = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Product>().HasData(
            // ─── Мгновенные награды (20-50 баллов) ───
            new
            {
                Id = Guid.Parse("a1b2c3d4-1111-4000-8000-000000000001"),
                Name = "Наклейка на выбор",
                Description = "Ребёнок выбирает одну наклейку из коллекции",
                Price = 20m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "stickers",
                ImageUrl = "/icons/sticker.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-1111-4000-8000-000000000002"),
                Name = "Выбор музыки в машине",
                Description = "Ребёнок выбирает плейлист на поездку",
                Price = 25m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "privileges",
                ImageUrl = "/icons/music.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-1111-4000-8000-000000000003"),
                Name = "Дополнительные 15 минут игры",
                Description = "Ещё 15 минут любимой игры или мультика",
                Price = 30m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "screen_time",
                ImageUrl = "/icons/gamepad.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-1111-4000-8000-000000000004"),
                Name = "Сладкий бонус",
                Description = "Одна конфета или печенье на выбор",
                Price = 20m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "treats",
                ImageUrl = "/icons/candy.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-1111-4000-8000-000000000005"),
                Name = "Не заправлять кровать",
                Description = "Один день без заправки кровати",
                Price = 40m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "privileges",
                ImageUrl = "/icons/bed.png",
                IsExclusive = false
            },

            // ─── Средние награды (80-200 баллов) ───
            new
            {
                Id = Guid.Parse("a1b2c3d4-2222-4000-8000-000000000001"),
                Name = "Настольная игра с родителем",
                Description = "Сесть и сыграть в настолку вместе",
                Price = 100m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "family",
                ImageUrl = "/icons/board-game.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-2222-4000-8000-000000000002"),
                Name = "Пикник в гостиной",
                Description = "Расстелить плед и устроить пикник с закусками дома",
                Price = 120m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "family",
                ImageUrl = "/icons/picnic.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-2222-4000-8000-000000000003"),
                Name = "Мини-кинотеатр",
                Description = "Выбрать мультфильм и посмотреть с попкорном",
                Price = 150m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "entertainment",
                ImageUrl = "/icons/movie.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-2222-4000-8000-000000000004"),
                Name = "30 минут творчества",
                Description = "Полчаса рисования, лепки или конструктора",
                Price = 80m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "creativity",
                ImageUrl = "/icons/art.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-2222-4000-8000-000000000005"),
                Name = "Ночной фонарик",
                Description = "Чтение с фонариком в палатке под столом",
                Price = 100m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "imagination",
                ImageUrl = "/icons/flashlight.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-2222-4000-8000-000000000006"),
                Name = "Завтрак в постель",
                Description = "Родитель подаёт завтрак прямо в кровать",
                Price = 180m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "privileges",
                ImageUrl = "/icons/breakfast.png",
                IsExclusive = false
            },

            // ─── Крупные награды (250-500 баллов) ───
            new
            {
                Id = Guid.Parse("a1b2c3d4-3333-4000-8000-000000000001"),
                Name = "Поход в парк аттракционов",
                Description = "Семейный выход в парк развлечений",
                Price = 400m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "experiences",
                ImageUrl = "/icons/park.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-3333-4000-8000-000000000002"),
                Name = "Мини-шопинг онлайн",
                Description = "Выбрать аксессуар или наклейки в интернет-магазине (до 100 лей)",
                Price = 500m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "shopping",
                ImageUrl = "/icons/shopping.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-3333-4000-8000-000000000003"),
                Name = "Пижамная вечеринка",
                Description = "Пригласить друга на ночёвку",
                Price = 350m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "social",
                ImageUrl = "/icons/party.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-3333-4000-8000-000000000004"),
                Name = "Новая книга",
                Description = "Выбрать книгу в магазине или онлайн",
                Price = 300m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "books",
                ImageUrl = "/icons/book.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-3333-4000-8000-000000000005"),
                Name = "Семейная прогулка",
                Description = "Выбрать маршрут для семейной прогулки на выходных",
                Price = 250m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = false,
                Category = "experiences",
                ImageUrl = "/icons/walk.png",
                IsExclusive = false
            },

            // ─── Премиум награды (требуют подписки) ───
            new
            {
                Id = Guid.Parse("a1b2c3d4-4444-4000-8000-000000000001"),
                Name = "Свой рецепт на ужин",
                Description = "Ребёнок выбирает что готовить на ужин всей семье",
                Price = 200m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = true,
                RequiredTier = "basic",
                Category = "privileges",
                ImageUrl = "/icons/chef.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-4444-4000-8000-000000000002"),
                Name = "Поздний отбой (+30 мин)",
                Description = "Лечь спать на полчаса позже",
                Price = 250m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = true,
                RequiredTier = "basic",
                Category = "privileges",
                ImageUrl = "/icons/moon.png",
                IsExclusive = false
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-4444-4000-8000-000000000003"),
                Name = "VIP-билет в кино",
                Description = "Поход в кинотеатр на любой фильм",
                Price = 600m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = true,
                RequiredTier = "premium",
                Category = "experiences",
                ImageUrl = "/icons/cinema.png",
                IsExclusive = true
            },
            new
            {
                Id = Guid.Parse("a1b2c3d4-4444-4000-8000-000000000004"),
                Name = "День без обязанностей",
                Description = "Полный выходной от всех домашних дел",
                Price = 500m,
                Stock = 999,
                IsActive = true,
                CreatedAt = seedTimestamp,
                IsPremium = true,
                RequiredTier = "premium",
                Category = "privileges",
                ImageUrl = "/icons/vacation.png",
                IsExclusive = true
            }
        );
    }
}
