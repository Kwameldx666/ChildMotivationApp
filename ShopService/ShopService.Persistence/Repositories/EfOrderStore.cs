using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ShopService.Domain.Entities;
using ShopService.Domain.Enums;
using ShopService.Infrastructure.Abstractions;
using ShopService.Persistence.Context;

namespace ShopService.Persistence.Repositories;

public class EfOrderStore : IOrderStore
{
    private readonly ShopDbContext _db;
    private readonly IMemoryCache _cache;
    private const string OrdersCachePrefix = "shop_orders_";

    public EfOrderStore(ShopDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<Order[]> GetAllAsync(string? userId = null, CancellationToken cancellationToken = default)
    {
        var cacheKey = OrdersCachePrefix + (string.IsNullOrWhiteSpace(userId) ? "all" : userId);
        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(1));
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

            var query = _db.Orders.AsNoTracking()
                .Include(o => o.Items)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(userId))
                query = query.Where(o => o.UserId == userId);

            return await query
                .OrderByDescending(o => o.CreatedAt)
                .ToArrayAsync(cancellationToken);
        }) ?? Array.Empty<Order>();
    }

    public Task<Order?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"shop_order_{id}";
        return _cache.GetOrCreateAsync(cacheKey, entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(1));
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

            return _db.Orders.AsNoTracking()
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        });
    }

    public async Task<Order> CreateAsync(Order order, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(order.UserId))
            throw new ArgumentException("UserId is required", nameof(order));
        if (order.Items.Count == 0)
            throw new ArgumentException("Order must contain at least one item", nameof(order));

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToArray();
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        foreach (var productId in productIds)
        {
            if (!products.ContainsKey(productId))
                throw new InvalidOperationException($"Product {productId} not found");
        }

        var items = new List<OrderItem>();
        foreach (var item in order.Items)
        {
            if (item.Quantity <= 0)
                throw new ArgumentException("Quantity must be positive", nameof(order));

            var product = products[item.ProductId];
            var newItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = item.Quantity,
                LineTotal = product.Price * item.Quantity
            };
            items.Add(newItem);
        }

        order.Id = order.Id == Guid.Empty ? Guid.NewGuid() : order.Id;
        order.CreatedAt = DateTime.UtcNow;
        order.Status = OrderStatus.Pending;
        order.Items = items;
        order.TotalAmount = items.Sum(i => i.LineTotal);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);
        InvalidateCache(order.Id, order.UserId);
        return order;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, OrderStatus status, CancellationToken cancellationToken = default)
    {
        var order = await _db.Orders.FindAsync(new object[] { id }, cancellationToken);
        if (order is null) return false;
        order.Status = status;
        _db.Orders.Update(order);
        await _db.SaveChangesAsync(cancellationToken);
        InvalidateCache(order.Id, order.UserId);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        if (order is null) return false;
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync(cancellationToken);
        InvalidateCache(id, order.UserId);
        return true;
    }

    private void InvalidateCache(Guid orderId, string userId)
    {
        _cache.Remove($"shop_order_{orderId}");
        _cache.Remove(OrdersCachePrefix + "all");
        if (!string.IsNullOrWhiteSpace(userId))
            _cache.Remove(OrdersCachePrefix + userId);
    }
}
