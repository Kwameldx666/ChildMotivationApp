using System.Net;
using System.Net.Http.Json;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TaskService.Api.Middlewares;
using TaskService.Application.Common.Exceptions;

namespace IntegrationTests;

public sealed class TaskExceptionHandlingMiddlewareIntegrationTests
{
    [Fact]
    public async Task Middleware_ShouldMapNotFoundException_To404()
    {
        using var host = await BuildHost(_ => throw new NotFoundException("Task", "42"));
        var client = host.GetTestClient();

        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("Entity 'Task' (42) was not found.", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Middleware_ShouldMapValidationException_To400WithErrors()
    {
        using var host = await BuildHost(_ =>
        {
            var failures = new[]
            {
                new FluentValidation.Results.ValidationFailure("Title", "Title is required")
            };
            throw new ValidationException(failures);
        });

        var client = host.GetTestClient();
        var response = await client.GetAsync("/test");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(payload);
        Assert.Equal("Validation failed", payload["message"].ToString());
    }

    [Fact]
    public async Task Middleware_ShouldMapUnknownException_To500()
    {
        using var host = await BuildHost(_ => throw new InvalidOperationException("boom"));
        var client = host.GetTestClient();

        var response = await client.GetAsync("/test");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Contains("An unexpected error occurred.", body, StringComparison.Ordinal);
    }

    private static async Task<IHost> BuildHost(Func<HttpContext, Task> terminalDelegate)
    {
        var hostBuilder = new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices(services =>
                {
                    services.AddLogging();
                    services.AddTransient<ExceptionHandlingMiddleware>();
                });
                webBuilder.Configure(app =>
                {
                    app.UseMiddleware<ExceptionHandlingMiddleware>();
                    app.Run(context => terminalDelegate(context));
                });
            });

        return await hostBuilder.StartAsync();
    }
}
