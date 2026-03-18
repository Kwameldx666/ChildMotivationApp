using Microsoft.EntityFrameworkCore;
using Npgsql;
using UserService.Application.Interfaces;
using UserService.Domain.Entities;
using UserService.Persistence.Context;

namespace UserService.Persistence.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly UserDbContext _context;

    public SubscriptionRepository(UserDbContext context)
    {
        _context = context;
    }

    public async Task<UserSubscription?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return null;
        }
    }

    public async Task<UserSubscription> CreateAsync(UserSubscription subscription, CancellationToken cancellationToken = default)
    {
        _context.Subscriptions.Add(subscription);
        await _context.SaveChangesAsync(cancellationToken);
        return subscription;
    }

    public async Task<UserSubscription> UpdateAsync(UserSubscription subscription, CancellationToken cancellationToken = default)
    {
        subscription.UpdatedAt = DateTime.UtcNow;
        _context.Subscriptions.Update(subscription);
        await _context.SaveChangesAsync(cancellationToken);
        return subscription;
    }

    public async Task DeleteAsync(Guid subscriptionId, CancellationToken cancellationToken = default)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == subscriptionId, cancellationToken);
        
        if (subscription is not null)
        {
            _context.Subscriptions.Remove(subscription);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
