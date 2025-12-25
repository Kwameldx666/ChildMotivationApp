using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Dto.Auth.Login;

namespace AuthService.Application.Abstractions.Infrastructure;

public interface IOAuthSessionStore
{
    Task<string> StoreAsync(ExternalLoginResponse session, CancellationToken cancellationToken);
    Task<ExternalLoginResponse?> TakeAsync(string token, CancellationToken cancellationToken);
}