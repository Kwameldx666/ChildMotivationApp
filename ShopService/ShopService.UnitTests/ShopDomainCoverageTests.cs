using ShopService.Domain.Entities;
using ShopService.Domain.Enums;
using System.Text.Json;

namespace ShopService.UnitTests;

public sealed class ShopDomainCoverageTests
{
    [Fact]
    public void Product_AllCoreProperties_ShouldRoundTripAssignedValues()
    {
        var id = Guid.NewGuid();
        var now = new DateTime(2026, 1, 15, 10, 30, 0, DateTimeKind.Utc);

        var product = new Product
        {
            Id = id,
            Name = "LEGO set",
            Description = "Advanced robotics kit",
            Price = 149.99m,
            Stock = 7,
            IsActive = false,
            CreatedAt = now,
            IsPremium = true,
            RequiredTier = "family",
            Category = "toys",
            ImageUrl = "https://cdn.example.com/rewards/lego.png",
            RecommendedAge = 9,
            IsExclusive = true
        };

        Assert.Equal(id, product.Id);
        Assert.Equal("LEGO set", product.Name);
        Assert.Equal("Advanced robotics kit", product.Description);
        Assert.Equal(149.99m, product.Price);
        Assert.Equal(7, product.Stock);
        Assert.False(product.IsActive);
        Assert.Equal(now, product.CreatedAt);
        Assert.True(product.IsPremium);
        Assert.Equal("family", product.RequiredTier);
        Assert.Equal("toys", product.Category);
        Assert.Equal("https://cdn.example.com/rewards/lego.png", product.ImageUrl);
        Assert.Equal(9, product.RecommendedAge);
        Assert.True(product.IsExclusive);
    }

    [Fact]
    public void Product_OptionalFields_ShouldAllowNullAssignments()
    {
        var product = new Product
        {
            RequiredTier = null,
            Category = null,
            ImageUrl = null,
            RecommendedAge = null,
            Description = null
        };

        Assert.Null(product.RequiredTier);
        Assert.Null(product.Category);
        Assert.Null(product.ImageUrl);
        Assert.Null(product.RecommendedAge);
        Assert.Null(product.Description);
    }

    [Fact]
    public void Order_AllProperties_ShouldRoundTripAssignedValues()
    {
        var id = Guid.NewGuid();
        var createdAt = new DateTime(2026, 2, 1, 8, 0, 0, DateTimeKind.Utc);
        var deliveredAt = createdAt.AddDays(1);
        var confirmedAt = deliveredAt.AddHours(3);

        var item = new OrderItem
        {
            Id = Guid.NewGuid(),
            ProductName = "Puzzle",
            UnitPrice = 19.5m,
            Quantity = 2,
            LineTotal = 39m
        };

        var order = new Order
        {
            Id = id,
            UserId = "child-42",
            CreatedAt = createdAt,
            Status = OrderStatus.Confirmed,
            TotalAmount = 39m,
            DeliveredAt = deliveredAt,
            DeliveredByUserId = "parent-1",
            ConfirmedAt = confirmedAt,
            ConfirmedByUserId = "child-42",
            DeliveryNotes = "Placed on desk",
            Items = new List<OrderItem> { item }
        };

        Assert.Equal(id, order.Id);
        Assert.Equal("child-42", order.UserId);
        Assert.Equal(createdAt, order.CreatedAt);
        Assert.Equal(OrderStatus.Confirmed, order.Status);
        Assert.Equal(39m, order.TotalAmount);
        Assert.Equal(deliveredAt, order.DeliveredAt);
        Assert.Equal("parent-1", order.DeliveredByUserId);
        Assert.Equal(confirmedAt, order.ConfirmedAt);
        Assert.Equal("child-42", order.ConfirmedByUserId);
        Assert.Equal("Placed on desk", order.DeliveryNotes);
        Assert.Single(order.Items);
    }

    [Fact]
    public void OrderItem_AllProperties_ShouldRoundTripAssignedValues()
    {
        var id = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var order = new Order { Id = orderId };
        var product = new Product { Id = productId, Name = "Headphones" };

        var item = new OrderItem
        {
            Id = id,
            OrderId = orderId,
            ProductId = productId,
            ProductName = "Headphones",
            UnitPrice = 89.99m,
            Quantity = 1,
            LineTotal = 89.99m,
            Order = order,
            Product = product
        };

        Assert.Equal(id, item.Id);
        Assert.Equal(orderId, item.OrderId);
        Assert.Equal(productId, item.ProductId);
        Assert.Equal("Headphones", item.ProductName);
        Assert.Equal(89.99m, item.UnitPrice);
        Assert.Equal(1, item.Quantity);
        Assert.Equal(89.99m, item.LineTotal);
        Assert.Same(order, item.Order);
        Assert.Same(product, item.Product);
    }

    [Fact]
    public void OrderItem_NavigationProperties_ShouldBeIgnoredInJsonSerialization()
    {
        var item = new OrderItem
        {
            ProductName = "Toy",
            Order = new Order { UserId = "u" },
            Product = new Product { Name = "Toy" }
        };

        var json = JsonSerializer.Serialize(item);

        Assert.Contains("ProductName", json, StringComparison.Ordinal);
        Assert.DoesNotContain("Order\":", json, StringComparison.Ordinal);
        Assert.DoesNotContain("Product\":", json, StringComparison.Ordinal);
    }

    [Fact]
    public void OrderStatus_ShouldExposeExpectedNumericValues()
    {
        Assert.Equal(0, (int)OrderStatus.Pending);
        Assert.Equal(1, (int)OrderStatus.Paid);
        Assert.Equal(2, (int)OrderStatus.AwaitingDelivery);
        Assert.Equal(3, (int)OrderStatus.Delivered);
        Assert.Equal(4, (int)OrderStatus.Confirmed);
        Assert.Equal(5, (int)OrderStatus.Completed);
        Assert.Equal(6, (int)OrderStatus.Cancelled);
    }
}
