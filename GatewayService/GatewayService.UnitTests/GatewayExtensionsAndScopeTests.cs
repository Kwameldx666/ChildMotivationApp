using System.Security.Claims;
using Gateway.Authorization.ScopeRequirement;
using Gateway.Exceptions;
using Gateway.Extensions;
using Microsoft.AspNetCore.Authorization;

namespace GatewayService.UnitTests;

public sealed class GatewayExtensionsAndScopeTests
{
    [Fact]
    public void GetUserId_ShouldThrow_WhenSubClaimMissing()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity());

        Assert.Throws<UnauthorizedException>(() => user.GetUserId());
    }

    [Fact]
    public async Task ScopeRequirementHandler_ShouldSucceed_WhenScopesExist()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("Scope", "user.read"),
            new Claim("Scope", "user.write")
        }, "test"));

        var requirement = new ScopeRequirement("user.read", "user.write");
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);

        var handler = new ScopeRequirementHandler();
        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }
}
