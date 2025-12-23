using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Application.Dto.User;
using AuthService.Application.Options;
using AuthService.Common.Constants.Claim;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Infrastructure.Services.Authentication.Token;

public class JwtBearerProvider(IOptions<JwtBearerOptions> options)
    : ITokenProvider
{
    private readonly JwtBearerOptions _optionValues = options.Value;


    public Task<GenerateTokenResponse> GenerateAccessToken(UserArgs args,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_optionValues.Secret))
            throw new InvalidOperationException("JWT secret is not configured.");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_optionValues.Secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, args.UserId),
            new(JwtRegisteredClaimNames.Email, args.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.CreateVersion7().ToString())
        };

        claims.AddRange(args.Roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(args.Scopes.Select(scope => new Claim(ClaimConstants.Scope, scope)));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _optionValues.Issuer,
            Audience = _optionValues.Audience,
            Expires = DateTime.UtcNow.AddMinutes(_optionValues.AccessTokenLifetime),
            SigningCredentials = credentials
        };

        var handler = new JsonWebTokenHandler();
        var accessToken = handler.CreateToken(descriptor);
        var refreshToken = GenerateRefreshToken();

        var response = new GenerateTokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };

        return Task.FromResult(response);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(_optionValues.RefreshTokenLength));
    }
}