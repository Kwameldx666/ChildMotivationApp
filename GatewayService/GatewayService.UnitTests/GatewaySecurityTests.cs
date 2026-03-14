using System.Net;
using System.Security.Claims;
using Gateway.Authorization.ScopeRequirement;
using Gateway.Infrastructure.Handlers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace UnitTests;

public sealed class GatewaySecurityTests
{
    [Fact]
    public async Task ScopeRequirementHandler_ShouldSucceed_WhenAllScopesExist()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("Scope", "tasks.read"),
            new Claim("Scope", "tasks.write")
        }, "test"));

        var requirement = new ScopeRequirement("tasks.read", "tasks.write");
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);
        var handler = new ScopeRequirementHandler();

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task ScopeRequirementHandler_ShouldFail_WhenScopeMissing()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("Scope", "tasks.read")
        }, "test"));

        var requirement = new ScopeRequirement("tasks.read", "tasks.write");
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, null);
        var handler = new ScopeRequirementHandler();

        await handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task AuthorizationForwardingHandler_ShouldCopyIncomingAuthorizationHeader()
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext()
        };
        accessor.HttpContext.Request.Headers.Authorization = "Bearer source-token";

        var inner = new CaptureHttpMessageHandler();
        var handler = new AuthorizationForwardingHandler(accessor)
        {
            InnerHandler = inner
        };

        using var invoker = new HttpMessageInvoker(handler);
        using var request = new HttpRequestMessage(HttpMethod.Get, "http://localhost/test");

        var response = await invoker.SendAsync(request, CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Bearer", inner.LastRequest!.Headers.Authorization!.Scheme);
        Assert.Equal("source-token", inner.LastRequest.Headers.Authorization!.Parameter);
    }

    private sealed class CaptureHttpMessageHandler : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }
}
