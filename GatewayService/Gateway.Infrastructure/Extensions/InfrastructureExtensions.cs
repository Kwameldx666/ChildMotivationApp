using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Infrastructure.Services.Clients;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Gateway.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IAuthServiceClient, AuthServiceClient>();
        
        return services;
    }
}