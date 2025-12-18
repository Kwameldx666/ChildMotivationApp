using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Services.Clients;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace Gateway.Extensions;

public static class PresentationExtension
{
    public static IServiceCollection AddPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.Configure<AuthEndpoint>(configuration.GetSection("ServiceEndpoints:AuthService"));
        services.AddNamedHttpClientsConfiguration();
        services.AddScoped<IAuthServiceClient, AuthServiceClient>();

        return services;
    }
    
    private static IServiceCollection AddNamedHttpClientsConfiguration(this IServiceCollection services)
    {
        services.AddHttpClient(DefaultHttpClientNames.AuthService)
            .ConfigureHttpClient((sp, client) =>
            {
                var endpoint = sp.GetRequiredService<IOptionsMonitor<AuthEndpoint>>().CurrentValue;
                if (string.IsNullOrWhiteSpace(endpoint.AuthEndpointUrl))
                {
                    throw new InvalidOperationException("Auth service endpoint is not configured.");
                }

                client.BaseAddress = new Uri(endpoint.AuthEndpointUrl);
            });

        return services;
    }
}