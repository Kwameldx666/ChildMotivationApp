using System.Net;
using System.Security.Claims;
using System.Text;
using Gateway.Exceptions;
using Gateway.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace UnitTests;

public sealed class GatewayExtensionsTests
{
    [Fact]
    public async Task ToActionResultAsync_ShouldMapStatusBodyAndContentType()
    {
        using var response = new HttpResponseMessage(HttpStatusCode.Accepted)
        {
            Content = new StringContent("{\"ok\":true}", Encoding.UTF8, "application/json")
        };

        var actionResult = await response.ToActionResultAsync();

        var contentResult = Assert.IsType<ContentResult>(actionResult);
        Assert.Equal((int)HttpStatusCode.Accepted, contentResult.StatusCode);
        Assert.Equal("{\"ok\":true}", contentResult.Content);
        Assert.Equal("application/json; charset=utf-8", contentResult.ContentType);
    }

    [Fact]
    public void GetUserId_ShouldReturnSubjectClaim_WhenPresent()
    {
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity(
                new[] { new Claim("sub", "abc-123") },
                "test-auth"));

        var userId = principal.GetUserId();

        Assert.Equal("abc-123", userId);
    }

    [Fact]
    public void GetUserId_ShouldThrowUnauthorized_WhenSubjectClaimMissing()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        Assert.Throws<UnauthorizedException>(() => principal.GetUserId());
    }
}
