using Gateway.Application.Dto.Login;
using Gateway.Application.Dto.Register;
using Gateway.Application.Dto.Auth;

namespace Gateway.Application.Interfaces.Infrastructure;

public interface IAuthServiceClient
{
    Task<HttpResponseMessage> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetGoogleAuthorizationAsync(CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetGoogleSessionAsync(string token, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetGooglePendingUserAsync(string token, CancellationToken cancellationToken);
    Task<HttpResponseMessage> CompleteGoogleSignInAsync(CompleteGoogleSignInRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetGitHubAuthorizationAsync(CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetGitHubSessionAsync(string token, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetGitHubPendingUserAsync(string token, CancellationToken cancellationToken);
    Task<HttpResponseMessage> CompleteGitHubSignInAsync(CompleteGoogleSignInRequest request, CancellationToken cancellationToken);
}