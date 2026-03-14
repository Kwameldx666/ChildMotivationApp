using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Handlers;
using Microsoft.AspNetCore.Http;

namespace GatewayService.UnitTests;

public sealed class GatewayHttpAndAuthAdditionalTests
{
    [Fact]
    public async Task AuthorizationForwardingHandler_ShouldNotOverrideExistingAuthorizationHeader()
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext()
        };
        accessor.HttpContext.Request.Headers.Authorization = "Bearer incoming-token";

        var inner = new CaptureHttpMessageHandler();
        var handler = new AuthorizationForwardingHandler(accessor)
        {
            InnerHandler = inner
        };

        using var invoker = new HttpMessageInvoker(handler);
        using var request = new HttpRequestMessage(HttpMethod.Get, "http://localhost/test")
        {
            Headers =
            {
                Authorization = new AuthenticationHeaderValue("Bearer", "existing-token")
            }
        };

        await invoker.SendAsync(request, CancellationToken.None);

        Assert.Equal("existing-token", inner.LastRequest!.Headers.Authorization!.Parameter);
    }

    [Fact]
    public async Task AuthorizationForwardingHandler_ShouldLeaveHeaderEmpty_WhenIncomingHeaderMissing()
    {
        var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };

        var inner = new CaptureHttpMessageHandler();
        var handler = new AuthorizationForwardingHandler(accessor)
        {
            InnerHandler = inner
        };

        using var invoker = new HttpMessageInvoker(handler);
        using var request = new HttpRequestMessage(HttpMethod.Get, "http://localhost/test");

        await invoker.SendAsync(request, CancellationToken.None);

        Assert.Null(inner.LastRequest!.Headers.Authorization);
    }

    [Fact]
    public async Task SendHttpRequestAsync_ShouldNotAttachContent_WhenBodyIsNull()
    {
        var handler = new CaptureHttpMessageHandler();
        using var client = new HttpClient(handler);

        await client.SendHttpRequestAsync<object>(HttpMethod.Get, "/ping", null, cancellationToken: CancellationToken.None);

        Assert.Equal(HttpMethod.Get, handler.LastRequest!.Method);
        Assert.Null(handler.LastRequest.Content);
    }

    [Fact]
    public async Task SendHttpRequestAsync_ShouldSerializeBody_WhenBodyProvided()
    {
        var handler = new CaptureHttpMessageHandler();
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://localhost")
        };

        var body = new DummyRequest("hello", 42);
        await client.SendHttpRequestAsync(HttpMethod.Post, "/echo", body, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        var json = await handler.LastRequest!.Content!.ReadAsStringAsync();
        Assert.Contains("hello", json, StringComparison.Ordinal);
        Assert.Contains("42", json, StringComparison.Ordinal);
        Assert.Equal(HttpMethod.Post, handler.LastRequest.Method);
    }

    private sealed record DummyRequest(string Name, int Count);

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
