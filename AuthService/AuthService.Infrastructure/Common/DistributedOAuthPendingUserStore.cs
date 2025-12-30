using System.Text.Json;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AuthService.Infrastructure.Common;

public class DistributedOAuthPendingUserStore : IOAuthPendingUserStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(15);
    private readonly IDistributedCache _cache;
    private readonly ILogger<DistributedOAuthPendingUserStore> _logger;

    public DistributedOAuthPendingUserStore(IDistributedCache cache, ILogger<DistributedOAuthPendingUserStore> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<string> StoreAsync(ExternalUserInfo pendingUser, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var token = Guid.NewGuid().ToString("N");
        var response = new ExternalPendingUserResponse(pendingUser.Email, pendingUser.Name, pendingUser.Picture);
        var key = BuildKey(token);
        var payload = JsonSerializer.Serialize(response);

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        };

        await _cache.SetStringAsync(key, payload, options, cancellationToken);
        _logger.LogDebug("DistributedOAuthPendingUserStore: stored key={Key}", key);
        return token;
    }

    public async Task<ExternalPendingUserResponse?> GetAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return null;
        var key = BuildKey(token);
        var payload = await _cache.GetStringAsync(key, cancellationToken);
        if (payload is null) return null;

        try
        {
            return JsonSerializer.Deserialize<ExternalPendingUserResponse>(payload);
        }
        catch
        {
            _logger.LogWarning("DistributedOAuthPendingUserStore: failed to deserialize payload for key {Key}", key);
            return null;
        }
    }

    public async Task<ExternalPendingUserResponse?> TakeAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return null;
        var key = BuildKey(token);
        var payload = await _cache.GetStringAsync(key, cancellationToken);
        if (payload is null) return null;

        await _cache.RemoveAsync(key, cancellationToken);
        try
        {
            return JsonSerializer.Deserialize<ExternalPendingUserResponse>(payload);
        }
        catch
        {
            _logger.LogWarning("DistributedOAuthPendingUserStore: failed to deserialize payload for key {Key}", key);
            return null;
        }
    }

    private static string BuildKey(string token) => $"oauth-pending-user:{token}";
}
