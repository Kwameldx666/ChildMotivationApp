using UserService.Domain.Entities;

namespace UserService.Application.Interfaces;

/// <summary>
/// Репозиторий для работы с подписками
/// </summary>
public interface ISubscriptionRepository
{
    Task<UserSubscription?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserSubscription> CreateAsync(UserSubscription subscription, CancellationToken cancellationToken = default);
    Task<UserSubscription> UpdateAsync(UserSubscription subscription, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid subscriptionId, CancellationToken cancellationToken = default);
}
