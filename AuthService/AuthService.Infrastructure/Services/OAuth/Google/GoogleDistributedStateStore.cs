using System.Security.Cryptography;
using System.Text;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Enums;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AuthService.Infrastructure.Services.OAuth.Google;

public class GoogleDistributedStateStore : IOAuthStateStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    private readonly IDistributedCache _cache;
    private readonly ILogger<GoogleDistributedStateStore> _logger;

    public GoogleDistributedStateStore(IDistributedCache cache, ILogger<GoogleDistributedStateStore> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<string> CreateStateAsync(ExternalProviderType provider, CancellationToken cancellationToken)
    {
        // Provider parameter is not used - this store is specific to Google in original design.
        cancellationToken.ThrowIfCancellationRequested();

        var buffer = RandomNumberGenerator.GetBytes(32);
        var state = Convert.ToBase64String(buffer)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var key = BuildKey(state);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        };

        await _cache.SetStringAsync(key, "1", options, cancellationToken);

        _logger.LogInformation("GoogleDistributedStateStore: created state (preview) {StatePreview}, key {KeyPreview}", state?.Substring(0, Math.Min(8, state.Length)), key?.Substring(0, Math.Min(12, key.Length)));

        return state;
    }

    public async Task<bool> ValidateStateAsync(ExternalProviderType provider, string state, CancellationToken cancellationToken)
    {
        // Provider parameter is not used - this store is specific to Google in original design.
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(state))
        {
            _logger.LogWarning("GoogleDistributedStateStore: validation failed - state is empty");
            return false;
        }

        var key = BuildKey(state);
        var found = await _cache.GetStringAsync(key, cancellationToken) is not null;
        _logger.LogInformation("GoogleDistributedStateStore: validating state (preview) {StatePreview}, key {KeyPreview}, found={Found}", state?.Substring(0, Math.Min(8, state.Length)), key?.Substring(0, Math.Min(12, key.Length)), found);

        if (!found) return false;

        await _cache.RemoveAsync(key, cancellationToken);
        return true;
    }

    private static string BuildKey(string state)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(state));
        return $"google-state:{Convert.ToBase64String(hash)}";
    }
}
