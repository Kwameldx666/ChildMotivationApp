using System.Diagnostics;
using System.Net;
using Gateway.Middlewares;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;

namespace IntegrationTests;

public sealed class GatewayMiddlewareIntegrationTests
{
    [Fact]
    public async Task CorrelationIdMiddleware_ShouldReuseIncomingHeader()
    {
        using var host = await BuildHost(async context =>
        {
            await context.Response.WriteAsync("ok");
        });

        var client = host.GetTestClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("X-Correlation-Id", "corr-123");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("X-Correlation-Id", out var values));
        Assert.Contains("corr-123", values);
    }

    [Fact]
    public async Task CorrelationIdMiddleware_ShouldGenerateHeader_WhenMissing()
    {
        using var host = await BuildHost(async context =>
        {
            await context.Response.WriteAsync("ok");
        });

        var client = host.GetTestClient();
        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("X-Correlation-Id", out var values));
        Assert.NotEmpty(values.First());
    }

    [Fact]
    public async Task CorrelationIdMiddleware_ShouldPropagateHeader_WhenActivityPresent()
    {
        using var host = await BuildHost(async context =>
        {
            await context.Response.WriteAsync("ok");
        });

        using var activity = new Activity("integration-test").Start();

        var client = host.GetTestClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("X-Correlation-Id", "activity-corr");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("X-Correlation-Id", out var values));
        Assert.Contains("activity-corr", values);
    }

    private static async Task<IHost> BuildHost(RequestDelegate terminalDelegate)
    {
        var hostBuilder = new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.Configure(app =>
                {
                    app.UseMiddleware<CorrelationIdMiddleware>();
                    app.Run(terminalDelegate);
                });
            });

        var host = await hostBuilder.StartAsync();
        return host;
    }
}
