using System.Security.Cryptography;
using System.Text;
using AuthService.Application.Abstractions.Infrastructure;
using Microsoft.Extensions.Caching.Memory;

namespace AuthService.Infrastructure.Services.OAuth;

public class GoogleStateStore(IMemoryCache cache) : IGoogleStateStore
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public Task<string> CreateStateAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var buffer = RandomNumberGenerator.GetBytes(32);
        var state = Convert.ToBase64String(buffer)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var key = BuildKey(state);
        cache.Set(key, true, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = Lifetime
        });

        return Task.FromResult(state);
    }

    public Task<bool> ValidateStateAsync(string state, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(state)) return Task.FromResult(false);

        var key = BuildKey(state);
        if (!cache.TryGetValue(key, out _)) return Task.FromResult(false);

        cache.Remove(key);
        return Task.FromResult(true);
    }

    private static string BuildKey(string state)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(state));
        return $"google-state:{Convert.ToBase64String(hash)}";
    }
}