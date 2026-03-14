using ShopService.Domain.Entities;
using ShopService.Domain.Enums;

namespace ShopService.UnitTests;

public sealed class ProductAndOrderDefaultsTests
{
    [Fact]
    public void Product_ShouldHaveExpectedDefaultValues()
    {
        var product = new Product();

        Assert.True(product.IsActive);
        Assert.False(product.IsPremium);
        Assert.False(product.IsExclusive);
    }

    [Fact]
    public void Order_ShouldHavePendingStatus_AndEmptyItems()
    {
        var order = new Order();

        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Empty(order.Items);
    }
}
