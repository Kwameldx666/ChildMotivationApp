using AuthService.Application.Dto;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Application.Dto.User;

namespace AuthService.Application.Abstractions.Infrastructure;

public interface ITokenProvider
{
    Task<GenerateTokenResponse> GenerateAccessToken(UserArgs args, CancellationToken cancellationToken = default);
    string GenerateRefreshToken();
}