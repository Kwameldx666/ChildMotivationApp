using ShopService.Domain.Entities;

namespace ShopService.Infrastructure.Abstractions;

public interface IProductStore
{
    Task<Product[]> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Product?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Product> CreateAsync(Product product, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Product product, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
