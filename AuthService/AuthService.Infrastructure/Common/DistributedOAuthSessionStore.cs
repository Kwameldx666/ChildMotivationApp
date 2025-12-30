using System.Text.Json;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AuthService.Infrastructure.Common;

public class DistributedOAuthSessionStore : IOAuthSessionStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);
    private readonly IDistributedCache _cache;
    private readonly ILogger<DistributedOAuthSessionStore> _logger;

    public DistributedOAuthSessionStore(IDistributedCache cache, ILogger<DistributedOAuthSessionStore> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<string> StoreAsync(ExternalLoginResponse session, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var token = Guid.NewGuid().ToString("N");
        var key = BuildKey(token);
        var payload = JsonSerializer.Serialize(session);

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        };

        await _cache.SetStringAsync(key, payload, options, cancellationToken);
        _logger.LogDebug("DistributedOAuthSessionStore: stored session key={Key}", key);
        return token;
    }

    public async Task<ExternalLoginResponse?> TakeAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(token)) return null;

        var key = BuildKey(token);
        var payload = await _cache.GetStringAsync(key, cancellationToken);
        if (payload is null) return null;

        await _cache.RemoveAsync(key, cancellationToken);
        try
        {
            return JsonSerializer.Deserialize<ExternalLoginResponse>(payload);
        }
        catch
        {
            _logger.LogWarning("DistributedOAuthSessionStore: failed to deserialize session for key {Key}", key);
            return null;
        }
    }

    private static string BuildKey(string token) => $"oauth-session:{token}";
}
