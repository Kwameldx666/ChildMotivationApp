using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using Microsoft.Extensions.Caching.Memory;

namespace AuthService.Infrastructure.Common;

public class OAuthPendingUserStore(IMemoryCache cache) :
    IOAuthPendingUserStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(15);

    public Task<string> StoreAsync(ExternalUserInfo pendingUser, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var token = Guid.NewGuid().ToString("N");
        var response = new ExternalPendingUserResponse(
            pendingUser.Email,
            pendingUser.Name,
            pendingUser.Picture,
            pendingUser.Sub);
        cache.Set(BuildKey(token), response, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        });

        return Task.FromResult(token);
    }

    public Task<ExternalPendingUserResponse?> GetAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return Task.FromResult<ExternalPendingUserResponse?>(null);

        var key = BuildKey(token);
        if (cache.TryGetValue(key, out var obj) && obj is ExternalPendingUserResponse t)
            return Task.FromResult<ExternalPendingUserResponse?>(t);

        return Task.FromResult<ExternalPendingUserResponse?>(null);
    }

    public Task<ExternalPendingUserResponse?> TakeAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return Task.FromResult<ExternalPendingUserResponse?>(null);

        var key = BuildKey(token);
        if (!cache.TryGetValue(key, out var obj) || obj is not ExternalPendingUserResponse t)
            return Task.FromResult<ExternalPendingUserResponse?>(null);

        cache.Remove(key);
        return Task.FromResult<ExternalPendingUserResponse?>(t);
    }

    private static string BuildKey(string token)
    {
        return $"oauth-pending-user:{token}";
    }
}