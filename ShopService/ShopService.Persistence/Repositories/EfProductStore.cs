using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ShopService.Domain.Entities;
using ShopService.Infrastructure.Abstractions;
using ShopService.Persistence.Context;

namespace ShopService.Persistence.Repositories;

public class  EfProductStore : IProductStore
{
    private readonly ShopDbContext _db;
    private readonly IMemoryCache _cache;
    private const string ProductsCacheKey = "shop_products_all";

    public EfProductStore(ShopDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<Product[]> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _cache.GetOrCreateAsync(ProductsCacheKey, async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(2));
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
            return await _db.Products.AsNoTracking()
                .OrderByDescending(p => p.CreatedAt)
                .ToArrayAsync(cancellationToken);
        }) ?? Array.Empty<Product>();
    }

    public Task<Product?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"shop_product_{id}";
        return _cache.GetOrCreateAsync(cacheKey, entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(2));
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
            return _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        });
    }

    public async Task<Product> CreateAsync(Product product, CancellationToken cancellationToken = default)
    {
        if (product.Id == Guid.Empty) product.Id = Guid.NewGuid();
        product.CreatedAt = DateTime.UtcNow;
        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);
        InvalidateCache(product.Id);
        return product;
    }

    public async Task<bool> UpdateAsync(Product product, CancellationToken cancellationToken = default)
    {
        var existing = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == product.Id, cancellationToken);
        if (existing is null) return false;

        product.CreatedAt = existing.CreatedAt;
        _db.Products.Update(product);
        await _db.SaveChangesAsync(cancellationToken);
        InvalidateCache(product.Id);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _db.Products.FindAsync(new object[] { id }, cancellationToken);
        if (entity is null) return false;
        _db.Products.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        InvalidateCache(id);
        return true;
    }

    private void InvalidateCache(Guid id)
    {
        _cache.Remove(ProductsCacheKey);
        _cache.Remove($"shop_product_{id}");
    }
}
