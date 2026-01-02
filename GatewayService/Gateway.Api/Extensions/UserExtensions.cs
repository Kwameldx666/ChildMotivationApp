using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Gateway.Extensions;

public static class UserExtensions
{
    public static string? GetUserId(this ClaimsPrincipal user)
    {
        return user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
