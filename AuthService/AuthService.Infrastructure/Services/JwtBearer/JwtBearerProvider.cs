using System.Security.Claims;
using System.Text;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto;
using AuthService.Common.Constants.Claim;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Infrastructure.Services.JwtBearer;

public class JwtBearerProvider : ITokenProvider
{
    private readonly JwtBearerOptions _optionValues;

    public JwtBearerProvider(IOptions<JwtBearerOptions> options)
    {
        _optionValues = options.Value;
    }

    public (string, int) GenerateAccessToken(UserArgs args)
    {
        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_optionValues.Secret));
        var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.Sha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, args.UserId),
            new Claim(JwtRegisteredClaimNames.Email, args.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.CreateVersion7().ToString()),
        };

        claims.AddRange(args.Roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(args.Scopes.Select(scope => new Claim(ClaimConstants.Scope, scope)));

        var descriptor = new SecurityTokenDescriptor()
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _optionValues.Issuer,
            Audience = _optionValues.Audience,
            Expires = DateTime.UtcNow.AddMinutes(_optionValues.AccessTokenLifetime),
            SigningCredentials = credentials
        };

        return (new JsonWebTokenHandler().CreateToken(descriptor), _optionValues.AccessTokenLifetime);
    }
}