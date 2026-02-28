using Gateway.Application.Features.Auth.DTOs;

namespace Gateway.Application.Abstractions.Infrastructure;

public interface IAuthServiceClient
{
    Task<HttpResponseMessage> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken);

    Task<HttpResponseMessage> GetSessionAsync(string token, CancellationToken cancellationToken);
    Task<HttpResponseMessage> GetPendingUserAsync(string token, CancellationToken cancellationToken);

    Task<HttpResponseMessage> GetGoogleAuthorizationAsync(CancellationToken cancellationToken);

    Task<HttpResponseMessage> CompleteGoogleSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken);

    Task<HttpResponseMessage> GetGitHubAuthorizationAsync(CancellationToken cancellationToken);

    Task<HttpResponseMessage> CompleteGitHubSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken);

    Task<HttpResponseMessage> GetDiscordAuthorizationAsync(CancellationToken cancellationToken);

    Task<HttpResponseMessage> CompleteDiscordSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken);

    Task<HttpResponseMessage> DeleteAccountAsync(Guid userId, CancellationToken cancellationToken);
    Task<HttpResponseMessage> ChangePasswordAsync(Guid userId, object request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> ChangeEmailAsync(Guid userId, object request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> ConfirmEmailAsync(object request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> ResendConfirmationAsync(object request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> RegisterChildAsync(Guid parentId, object request, CancellationToken cancellationToken);
    Task<HttpResponseMessage> ResetChildPasswordAsync(Guid parentId, object request, CancellationToken cancellationToken);
}