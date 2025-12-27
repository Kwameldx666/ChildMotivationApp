using System.Security.Cryptography;
using System.Text;
using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Authentication;
using Microsoft.Extensions.Caching.Memory;

namespace AuthService.Infrastructure.Services.OAuth;

public class GitHubStateStore(IMemoryCache cache) : IOAuthStateStore
{
    private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(15);

    public Task<string> CreateStateAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var buffer = RandomNumberGenerator.GetBytes(32);
        var state = Convert.ToBase64String(buffer)
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", "");

        var key = BuildKey(state);
        cache.Set(key, state, _cacheExpiration);

        return Task.FromResult(state);
    }

    public Task<bool> ValidateStateAsync(string state, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrEmpty(state)) return Task.FromResult(false);

        var key = BuildKey(state);
        if (!cache.TryGetValue(key, out _)) return Task.FromResult(false);

        cache.Remove(key);
        return Task.FromResult(true);
    }

    private string BuildKey(string state)
    {
        var sha256 = SHA256.Create();
        var key = sha256.ComputeHash(Encoding.UTF8.GetBytes(state));
        return "github-state:" + key;
    }
}