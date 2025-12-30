using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;

namespace AuthService.Infrastructure.Common;

// No-op pending user store used when distributed cache is disabled and we must avoid memory caching.
public class NoopOAuthPendingUserStore : IOAuthPendingUserStore
{
    public Task<string> StoreAsync(ExternalUserInfo pendingUser, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(Guid.NewGuid().ToString("N"));
    }

    public Task<ExternalPendingUserResponse?> GetAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult<ExternalPendingUserResponse?>(null);
    }

    public Task<ExternalPendingUserResponse?> TakeAsync(string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult<ExternalPendingUserResponse?>(null);
    }
}
