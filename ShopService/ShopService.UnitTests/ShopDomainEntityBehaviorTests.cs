using ShopService.Domain.Entities;
using ShopService.Domain.Enums;

namespace ShopService.UnitTests;

public sealed class ShopDomainEntityBehaviorTests
{
    [Fact]
    public void Order_ShouldInitializeDeliveryFields_AsNull()
    {
        var order = new Order();

        Assert.Null(order.DeliveredAt);
        Assert.Null(order.DeliveredByUserId);
        Assert.Null(order.ConfirmedAt);
        Assert.Null(order.ConfirmedByUserId);
        Assert.Null(order.DeliveryNotes);
    }

    [Fact]
    public void Order_ItemsCollection_ShouldAllowAppendingOrderItems()
    {
        var order = new Order();

        order.Items.Add(new OrderItem
        {
            ProductName = "Sticker Pack",
            UnitPrice = 9.99m,
            Quantity = 2,
            LineTotal = 19.98m
        });

        Assert.Single(order.Items);
        Assert.Equal(OrderStatus.Pending, order.Status);
    }

    [Fact]
    public void Product_ShouldKeepPremiumConfiguration()
    {
        var product = new Product
        {
            Name = "Rare Badge",
            IsPremium = true,
            RequiredTier = "premium",
            Category = "collectibles",
            IsExclusive = true,
            RecommendedAge = 10
        };

        Assert.True(product.IsPremium);
        Assert.Equal("premium", product.RequiredTier);
        Assert.Equal("collectibles", product.Category);
        Assert.True(product.IsExclusive);
        Assert.Equal(10, product.RecommendedAge);
    }

    [Fact]
    public void OrderItem_LineTotal_ShouldBeConsistentWithAssignedValues()
    {
        var item = new OrderItem
        {
            ProductName = "Book",
            UnitPrice = 15m,
            Quantity = 3,
            LineTotal = 45m
        };

        Assert.Equal(item.UnitPrice * item.Quantity, item.LineTotal);
    }
}
