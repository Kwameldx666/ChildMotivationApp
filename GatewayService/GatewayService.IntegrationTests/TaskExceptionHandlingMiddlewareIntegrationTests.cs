using System.Net;
using System.Text.Json;
using Gateway.Exceptions;
using Gateway.Middlewares;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace IntegrationTests;

public sealed class TaskExceptionHandlingMiddlewareIntegrationTests
{
    [Fact]
    public async Task GlobalExceptionHandler_ShouldMapUnauthorizedException_To401()
    {
        using var host = await BuildHost(() => throw new UnauthorizedException("token missing"));
        var client = host.GetTestClient();

        var response = await client.GetAsync("/boom");
        var payload = await ParseJson(response);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(401, payload.GetProperty("code").GetInt32());
        Assert.Equal("token missing", payload.GetProperty("description").GetString());
    }

    [Fact]
    public async Task GlobalExceptionHandler_ShouldMapUnknownException_To500()
    {
        using var host = await BuildHost(() => throw new InvalidOperationException("boom"));
        var client = host.GetTestClient();
        var response = await client.GetAsync("/boom");
        var payload = await ParseJson(response);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal(500, payload.GetProperty("code").GetInt32());
        Assert.Equal("boom", payload.GetProperty("description").GetString());
    }

    private static async Task<IHost> BuildHost(Action throwException)
    {
        var hostBuilder = new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices(services =>
                {
                    services.AddLogging();
                    services.AddExceptionHandler<GlobalExceptionHandler>();
                });
                webBuilder.Configure(app =>
                {
                    app.UseExceptionHandler();
                    app.Run(_ =>
                    {
                        throwException();
                        return Task.CompletedTask;
                    });
                });
            });

        return await hostBuilder.StartAsync();
    }

    private static async Task<JsonElement> ParseJson(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        return document.RootElement.Clone();
    }
}
