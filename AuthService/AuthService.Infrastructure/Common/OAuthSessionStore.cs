using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Dto.Auth.Login;
using Microsoft.Extensions.Caching.Memory;

namespace AuthService.Infrastructure.Services.OAuth;

public class OAuthSessionStore(IMemoryCache cache) : IOAuthSessionStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);

    public Task<string> StoreAsync(ExternalLoginResponse session, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var token = Guid.NewGuid().ToString("N");
        cache.Set(BuildKey(token), session, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        });

        return Task.FromResult(token);
    }

    public Task<ExternalLoginResponse?> TakeAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return Task.FromResult<ExternalLoginResponse?>(null);

        var key = BuildKey(token);
        if (!cache.TryGetValue(key, out ExternalLoginResponse? session))
            return Task.FromResult<ExternalLoginResponse?>(null);

        cache.Remove(key);
        return Task.FromResult(session);
    }

    private static string BuildKey(string token)
    {
        return $"oauth-session:{token}";
    }
}