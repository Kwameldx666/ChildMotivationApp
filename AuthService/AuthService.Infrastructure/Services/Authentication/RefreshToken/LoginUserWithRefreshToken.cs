using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Infrastructure.Services.JwtBearer;
using AuthService.Persistence.Repositories;
using Mapster;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Services.Login;

internal sealed class LoginUserWithRefreshToken(
    RefreshTokenRepository repository,
    ITokenProvider tokenProvider,
    IOptions<JwtBearerOptions> options)
{
    private readonly JwtBearerOptions _options = options.Value;

    public async Task<LoginResponse> Handle(string refreshTokenRequest)
    {
        var refreshToken = await repository.GetRefreshTokenByRefreshToken(refreshTokenRequest);

        if (refreshToken is null || refreshToken.ExpiresOnUtc < DateTime.UtcNow)
        {
            throw new ApplicationException("The refresh token has expired");
        }

        var tokenResponse = await tokenProvider.GenerateAccessToken(refreshToken.User.Adapt<UserArgs>());

        refreshToken.Token = tokenResponse.RefreshToken;
        refreshToken.ExpiresOnUtc = DateTime.UtcNow.AddDays(_options.RefreshTokenLifetime);

        repository.UpdateRefreshToken(refreshToken);
        await repository.SaveChangesAsync();

        var loginResponse = new LoginResponse(tokenResponse.AccessToken, tokenResponse.RefreshToken);
        return loginResponse;
    }
}