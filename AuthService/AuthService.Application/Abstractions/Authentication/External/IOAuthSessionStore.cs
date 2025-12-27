using AuthService.Application.Dto.User;

namespace AuthService.Application.Abstractions.Authentication.External;

public interface IOAuthSessionStore
{
    Task<string> StoreAsync(ExternalLoginResponse session, CancellationToken cancellationToken);
    Task<ExternalLoginResponse?> TakeAsync(string token, CancellationToken cancellationToken);
}