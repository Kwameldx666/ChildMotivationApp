using System.Security.Cryptography;
using System.Text;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Enums;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AuthService.Infrastructure.Services.OAuth;

public class DistributedOAuthStateStore : IOAuthStateStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    private readonly IDistributedCache _cache;
    private readonly ILogger<DistributedOAuthStateStore> _logger;

    public DistributedOAuthStateStore(IDistributedCache cache, ILogger<DistributedOAuthStateStore> logger)
    {
        _cache = cache;
        _logger = logger;
    }

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

        await _cache.SetStringAsync(key, "1", options, cancellationToken);

        _logger.LogInformation("DistributedOAuthStateStore: created state (preview) {StatePreview}, key {KeyPreview}, provider={Provider}", state?.Substring(0, Math.Min(8, state.Length)), key?.Substring(0, Math.Min(12, key.Length)), provider);

        return state;
    }

    public async Task<bool> ValidateStateAsync(ExternalProviderType provider, string state, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(state))
        {
            _logger.LogWarning("DistributedOAuthStateStore: validation failed - state is empty");
            return false;
        }

        var key = BuildKey(provider, state);
        var found = await _cache.GetStringAsync(key, cancellationToken) is not null;
        _logger.LogInformation("DistributedOAuthStateStore: validating state (preview) {StatePreview}, key {KeyPreview}, found={Found}, provider={Provider}", state?.Substring(0, Math.Min(8, state.Length)), key?.Substring(0, Math.Min(12, key.Length)), found, provider);

        if (!found) return false;

        await _cache.RemoveAsync(key, cancellationToken);
        return true;
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
