using System.Security.Cryptography;
using System.Text;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Enums;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AuthService.Infrastructure.Services.OAuth;

public class DistributedOAuthStateStore(IDistributedCache cache, ILogger<DistributedOAuthStateStore> logger) : IOAuthStateStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public async Task<string> CreateStateAsync(ExternalProviderType provider, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var buffer = RandomNumberGenerator.GetBytes(32);
        var state = Convert.ToBase64String(buffer)
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", "");

        var key = BuildKey(provider, state);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        };

        await cache.SetStringAsync(key, "1", options, cancellationToken);
        logger.LogDebug("Created OAuth state for {Provider}", provider);

        return state;
    }

    public async Task<bool> ValidateStateAsync(ExternalProviderType provider, string state, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(state))
        {
            logger.LogWarning("OAuth state validation failed - state is empty");
            return false;
        }

        var key = BuildKey(provider, state);
        
        try
        {
            var found = await cache.GetStringAsync(key, cancellationToken) is not null;
            
            if (!found)
            {
                logger.LogWarning("OAuth state not found for {Provider}", provider);
                return false;
            }

            await cache.RemoveAsync(key, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Redis error while validating OAuth state for {Provider}", provider);
            return false;
        }
    }

    private static string BuildKey(ExternalProviderType provider, string state)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(state));
        var baseKey = Convert.ToBase64String(hash);
        var prefix = provider switch
        {
            ExternalProviderType.Google => "google-state:",
            ExternalProviderType.GitHub => "github-state:",
            ExternalProviderType.Discord => "discord-state:",
            _ => "oauth-state:"
        };

        return prefix + baseKey;
    }
}
