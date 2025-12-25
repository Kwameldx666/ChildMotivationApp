using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto.User;
using Microsoft.Extensions.Caching.Memory;

namespace AuthService.Infrastructure.Services.OAuth;

public class OAuthPendingUserStore(IMemoryCache cache) : IOAuthPendingUserStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(15);

    public Task<string> StoreAsync(GooglePendingUser pendingUser, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var token = Guid.NewGuid().ToString("N");
        cache.Set(BuildKey(token), pendingUser, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        });

        return Task.FromResult(token);
    }

    public Task<GooglePendingUser?> GetAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return Task.FromResult<GooglePendingUser?>(null);

        var key = BuildKey(token);
        if (cache.TryGetValue(key, out GooglePendingUser? pendingUser)) return Task.FromResult(pendingUser);

        return Task.FromResult<GooglePendingUser?>(null);
    }

    public Task<GooglePendingUser?> TakeAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return Task.FromResult<GooglePendingUser?>(null);

        var key = BuildKey(token);
        if (!cache.TryGetValue(key, out GooglePendingUser? pendingUser))
            return Task.FromResult<GooglePendingUser?>(null);

        cache.Remove(key);
        return Task.FromResult(pendingUser);
    }

    private static string BuildKey(string token)
    {
        return $"oauth-pending-user:{token}";
    }
}