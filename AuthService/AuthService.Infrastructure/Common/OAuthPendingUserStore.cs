using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Dto.User;
using Microsoft.Extensions.Caching.Memory;

namespace AuthService.Infrastructure.Services.OAuth;

public class OAuthPendingUserStore(IMemoryCache cache) :
    IOAuthPendingUserStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(15);

    public Task<string> StorePendingUserAsync(GooglePendingUser pendingUser, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var token = Guid.NewGuid().ToString("N");
        cache.Set(BuildKey(token), pendingUser, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        });

        return Task.FromResult(token);
    }

    public Task<T?> GetAsync<T>(string token, CancellationToken cancellationToken)
        where T : class
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return Task.FromResult<T?>(null);

        var key = BuildKey(token);
        if (cache.TryGetValue(key, out var obj) && obj is T t) return Task.FromResult<T?>(t);

        return Task.FromResult<T?>(null);
    }

    public Task<T?> TakeAsync<T>(string token, CancellationToken cancellationToken) where T : class
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return Task.FromResult<T?>(null);

        var key = BuildKey(token);
        if (!cache.TryGetValue(key, out var obj) || obj is not T t)
            return Task.FromResult<T?>(null);

        cache.Remove(key);
        return Task.FromResult<T?>(t);
    }

    // Generic store method required by IOAuthPendingUserStore
    public Task<string> StoreAsync<T>(T pendingUser, CancellationToken cancellationToken) where T : class
    {
        if (pendingUser is GooglePendingUser gp)
            return StorePendingUserAsync(gp, cancellationToken);

        throw new ArgumentException("Unsupported pending user type", nameof(pendingUser));
    }

    // Adapter for the abstraction interface (store by object)
    public Task<string> StoreAsync(object pendingUser, CancellationToken cancellationToken)
    {
        if (pendingUser is GooglePendingUser gp)
            return StorePendingUserAsync(gp, cancellationToken);

        throw new ArgumentException("Unsupported pending user type", nameof(pendingUser));
    }

    private static string BuildKey(string token)
    {
        return $"oauth-pending-user:{token}";
    }
}