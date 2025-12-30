using Gateway.Application.Dto.Auth;
using Gateway.Application.Dto.Login;
using Gateway.Application.Dto.Register;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IAuthServiceClient
{
    Task<HttpResponseMessage> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken);

    Task<HttpResponseMessage> GetGoogleAuthorizationAsync(CancellationToken cancellationToken);

    // Generic session/pending endpoints (used for all providers)
    Task<HttpResponseMessage> GetSessionAsync(string token, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetPendingUserAsync(string token, CancellationToken cancellationToken);

    Task<HttpResponseMessage> CompleteGoogleSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken);

    Task<HttpResponseMessage> GetGitHubAuthorizationAsync(CancellationToken cancellationToken);

    Task<HttpResponseMessage> CompleteGitHubSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken);    
    
    Task<HttpResponseMessage> GetDiscordAuthorizationAsync(CancellationToken cancellationToken);

    Task<HttpResponseMessage> CompleteDiscordSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken);
}