using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.Constants.Claim;
using AuthService.Domain.Entities;
using AuthService.Persistence.Repositories;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Infrastructure.Services.JwtBearer;

public class JwtBearerProvider(
    IOptions<JwtBearerOptions> options,
    GenericRepository<RefreshToken, Guid> refreshTokenRepository)
    : ITokenProvider
{
    private readonly JwtBearerOptions _optionValues = options.Value;


    public async Task<GenerateTokenResponse> GenerateAccessToken(UserArgs args, CancellationToken cancellationToken = default)
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

        var refreshToken = new RefreshToken
        {
            Id = Guid.CreateVersion7(),
            ExpiresOnUtc = DateTime.UtcNow.AddDays(_optionValues.AccessTokenLifetime),
            Token = GenerateRefreshToken(),
            UserId = Guid.TryParse(args.UserId, out var userId) ? userId : Guid.Empty
        };

        refreshTokenRepository.Add(refreshToken);
        await refreshTokenRepository.SaveChanges(cancellationToken);


        var handler = new JsonWebTokenHandler();
        var accessToken = handler.CreateToken(descriptor);

        var response = new GenerateTokenResponse()
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
        };
        
        return response;
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(_optionValues.RefreshTokenLength));
    }
}