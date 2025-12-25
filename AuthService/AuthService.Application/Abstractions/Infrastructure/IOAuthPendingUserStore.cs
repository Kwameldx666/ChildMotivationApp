using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Dto.User;

namespace AuthService.Application.Abstractions.Infrastructure;

public interface IOAuthPendingUserStore
{
    Task<string> StoreAsync(GooglePendingUser pendingUser, CancellationToken cancellationToken);
    Task<GooglePendingUser?> GetAsync(string token, CancellationToken cancellationToken);
    Task<GooglePendingUser?> TakeAsync(string token, CancellationToken cancellationToken);
}