using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Gateway.Exceptions;

namespace Gateway.Extensions;

public static class UserExtensions
{
    public static string? GetUserId(this ClaimsPrincipal user)
    {
        return user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? throw new UnauthorizedException();
    }
}