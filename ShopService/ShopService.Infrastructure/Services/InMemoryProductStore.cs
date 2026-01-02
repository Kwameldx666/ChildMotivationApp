using ShopService.Domain.Entities;
using ShopService.Infrastructure.Abstractions;

namespace ShopService.Infrastructure.Services;

public class InMemoryProductStore : IProductStore
{
    private readonly Dictionary<Guid, Product> _products = new();
    private readonly object _lock = new();

    public Task<Product[]> GetAllAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(_products.Values.OrderByDescending(p => p.CreatedAt).ToArray());
        }
    }

    public Task<Product?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _products.TryGetValue(id, out var product);
            return Task.FromResult(product);
        }
    }

    public Task<Product> CreateAsync(Product product, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            product.Id = product.Id == Guid.Empty ? Guid.NewGuid() : product.Id;
            product.CreatedAt = DateTime.UtcNow;
            _products[product.Id] = product;
            return Task.FromResult(product);
        }
    }

    public Task<bool> UpdateAsync(Product product, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            if (!_products.ContainsKey(product.Id)) return Task.FromResult(false);
            var existing = _products[product.Id];
            product.CreatedAt = existing.CreatedAt;
            _products[product.Id] = product;
            return Task.FromResult(true);
        }
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(_products.Remove(id));
        }
    }
}
