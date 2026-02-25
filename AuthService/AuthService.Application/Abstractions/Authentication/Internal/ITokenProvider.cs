using AuthService.Application.Models.Auth.Login;
using AuthService.Application.Models.User;

namespace AuthService.Application.Abstractions.Authentication.Internal;

public interface ITokenProvider
{
    Task<GenerateTokenResponse> GenerateAccessToken(UserArgs args, CancellationToken cancellationToken = default);
    string GenerateRefreshToken();
    DateTime ProvideAccessTokenLifetime();
    DateTime ProvideRefreshTokenLifetime();
}