using ShopService.Domain.Entities;
using ShopService.Domain.Enums;

namespace ShopService.Infrastructure.Abstractions;

public interface IOrderStore
{
    Task<Order[]> GetAllAsync(string? userId = null, CancellationToken cancellationToken = default);
    Task<Order?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Order> CreateAsync(Order order, CancellationToken cancellationToken = default);
    Task<bool> UpdateStatusAsync(Guid id, OrderStatus status, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    
    // Новые методы для подтверждения выдачи награды
    Task<bool> MarkAsDeliveredAsync(Guid id, string deliveredByUserId, string? notes, CancellationToken cancellationToken = default);
    Task<bool> ConfirmReceivedAsync(Guid id, string confirmedByUserId, CancellationToken cancellationToken = default);
}
