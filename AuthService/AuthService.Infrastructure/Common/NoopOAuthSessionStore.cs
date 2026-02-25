using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;

namespace AuthService.Infrastructure.Common;

// No-op session store used when distributed cache is disabled and we must avoid memory caching.
public class NoopOAuthSessionStore : IOAuthSessionStore
{
    public Task<string> StoreAsync(ExternalLoginResponse session, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        // Return a token but do not persist anything — retrieval will not succeed.
        return Task.FromResult(Guid.NewGuid().ToString("N"));
    }

    public Task<ExternalLoginResponse?> TakeAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult<ExternalLoginResponse?>(null);
    }
}
