using AuthService.Application.Dto.User;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IOAuthPendingUserStore
{
    Task<string> StoreAsync(ExternalUserInfo pendingUser, CancellationToken cancellationToken);
    Task<ExternalPendingUserResponse?> GetAsync(string token, CancellationToken cancellationToken);
    Task<ExternalPendingUserResponse?> TakeAsync(string token, CancellationToken cancellationToken);
}