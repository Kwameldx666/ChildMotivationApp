using ShopService.Domain.Entities;
using ShopService.Domain.Enums;
using ShopService.Infrastructure.Abstractions;

namespace ShopService.Infrastructure.Services;

public class InMemoryOrderStore : IOrderStore
{
    private readonly IProductStore _productStore;
    private readonly Dictionary<Guid, Order> _orders = new();
    private readonly object _lock = new();

    public InMemoryOrderStore(IProductStore productStore)
    {
        _productStore = productStore;
    }

    public Task<Order[]> GetAllAsync(string? userId = null, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var query = _orders.Values.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(userId))
                query = query.Where(o => string.Equals(o.UserId, userId, StringComparison.Ordinal));
            return Task.FromResult(query.OrderByDescending(o => o.CreatedAt).ToArray());
        }
    }

    public Task<Order?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _orders.TryGetValue(id, out var order);
            return Task.FromResult(order);
        }
    }

    public async Task<Order> CreateAsync(Order order, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(order.UserId))
            throw new ArgumentException("UserId is required", nameof(order));
        if (order.Items.Count == 0)
            throw new ArgumentException("Order must contain at least one item", nameof(order));

        var items = new List<OrderItem>();
        foreach (var item in order.Items)
        {
            var product = await _productStore.GetAsync(item.ProductId, cancellationToken) ??
                          throw new InvalidOperationException($"Product {item.ProductId} not found");

            if (item.Quantity <= 0) throw new ArgumentException("Quantity must be positive", nameof(order));

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

        lock (_lock)
        {
            order.Id = order.Id == Guid.Empty ? Guid.NewGuid() : order.Id;
            order.CreatedAt = DateTime.UtcNow;
            order.Status = OrderStatus.Pending;
            order.Items = items;
            order.TotalAmount = items.Sum(i => i.LineTotal);
            _orders[order.Id] = order;
            return order;
        }
    }

    public Task<bool> UpdateStatusAsync(Guid id, OrderStatus status, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            if (!_orders.TryGetValue(id, out var order)) return Task.FromResult(false);
            order.Status = status;
            _orders[id] = order;
            return Task.FromResult(true);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(_orders.Remove(id));
        }
    }

    public Task<bool> MarkAsDeliveredAsync(Guid id, string deliveredByUserId, string? notes, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            if (!_orders.TryGetValue(id, out var order)) return Task.FromResult(false);
            
            order.Status = OrderStatus.Delivered;
            order.DeliveredAt = DateTime.UtcNow;
            order.DeliveredByUserId = deliveredByUserId;
            order.DeliveryNotes = notes;
            
            _orders[id] = order;
            return Task.FromResult(true);
        }
    }

    public Task<bool> ConfirmReceivedAsync(Guid id, string confirmedByUserId, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            if (!_orders.TryGetValue(id, out var order)) return Task.FromResult(false);
            
            order.Status = OrderStatus.Confirmed;
            order.ConfirmedAt = DateTime.UtcNow;
            order.ConfirmedByUserId = confirmedByUserId;
            
            _orders[id] = order;
            return Task.FromResult(true);
        }
    }
}
