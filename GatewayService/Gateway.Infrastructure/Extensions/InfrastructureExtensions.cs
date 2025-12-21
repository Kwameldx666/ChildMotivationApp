using System;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Handlers;
using Gateway.Infrastructure.Services.Clients;
using Gateway.Infrastructure.Services.Constants;
using Gateway.Infrastructure.Mappings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Mapster;

namespace Gateway.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AuthEndpoints>(configuration.GetSection("ServiceEndpoints:AuthService"));
        TypeAdapterConfig.GlobalSettings.Scan(typeof(AuthMappingConfig).Assembly);
        services.AddTransient<AuthorizationForwardingHandler>();

        services.AddHttpClient(DefaultHttpClientNames.AuthService, client =>
        {
            var baseAddress = configuration["Services:AuthService"]
                              ?? throw new InvalidOperationException("Services:AuthService configuration is missing.");

            client.BaseAddress = new Uri(baseAddress);
        }).AddHttpMessageHandler<AuthorizationForwardingHandler>();

        services.AddProxies();

        return services;
    }

    private static void AddProxies(this IServiceCollection services)
    {
        services.AddScoped<IAuthServiceClient, AuthServiceClient>();
    }
}