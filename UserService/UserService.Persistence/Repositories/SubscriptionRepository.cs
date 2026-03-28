using Microsoft.EntityFrameworkCore;
using Npgsql;
using UserService.Application.Interfaces;
using UserService.Domain.Entities;
using UserService.Persistence.Context;

namespace UserService.Persistence.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly UserDbContext _context;
    private const string UndefinedTableSqlState = "42P01";

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
        catch (PostgresException ex) when (ex.SqlState == UndefinedTableSqlState)
        {
            await EnsureSubscriptionsStorageAsync(cancellationToken);
            return null;
        }
    }

    public async Task<UserSubscription> CreateAsync(UserSubscription subscription, CancellationToken cancellationToken = default)
    {
        try
        {
            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync(cancellationToken);
            return subscription;
        }
        catch (PostgresException ex) when (ex.SqlState == UndefinedTableSqlState)
        {
            await EnsureSubscriptionsStorageAsync(cancellationToken);
            _context.ChangeTracker.Clear();
            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync(cancellationToken);
            return subscription;
        }
    }

    public async Task<UserSubscription> UpdateAsync(UserSubscription subscription, CancellationToken cancellationToken = default)
    {
        subscription.UpdatedAt = DateTime.UtcNow;
        try
        {
            _context.Subscriptions.Update(subscription);
            await _context.SaveChangesAsync(cancellationToken);
            return subscription;
        }
        catch (PostgresException ex) when (ex.SqlState == UndefinedTableSqlState)
        {
            await EnsureSubscriptionsStorageAsync(cancellationToken);
            throw;
        }
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

    private async Task EnsureSubscriptionsStorageAsync(CancellationToken cancellationToken)
    {
        await _context.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id uuid PRIMARY KEY,
                user_id uuid NOT NULL,
                tier character varying(50) NOT NULL,
                status character varying(50) NOT NULL,
                start_date timestamp with time zone NOT NULL,
                end_date timestamp with time zone NULL,
                cancelled_at timestamp with time zone NULL,
                auto_renew boolean NOT NULL DEFAULT true,
                price_per_month numeric(10,2) NOT NULL,
                max_children integer NOT NULL DEFAULT 2,
                max_tasks_per_day integer NOT NULL DEFAULT 10,
                has_ai_assistant boolean NOT NULL DEFAULT false,
                has_advanced_analytics boolean NOT NULL DEFAULT false,
                has_custom_rewards boolean NOT NULL DEFAULT false,
                has_priority_support boolean NOT NULL DEFAULT false,
                has_family_sharing boolean NOT NULL DEFAULT false,
                has_offline_mode boolean NOT NULL DEFAULT false,
                created_at timestamp with time zone NOT NULL DEFAULT NOW(),
                updated_at timestamp with time zone NOT NULL DEFAULT NOW()
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions(user_id);
            """, cancellationToken);
    }
}
