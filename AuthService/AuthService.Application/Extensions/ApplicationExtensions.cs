using AuthService.Application.Pipeline;
using FluentValidation;
using Mapster;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Application.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(ApplicationExtensions).Assembly;

        services.AddValidatorsFromAssembly(assembly);

        services.AddMediatR(configuration =>
        {
            configuration.RegisterServicesFromAssembly(assembly);
            configuration.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        TypeAdapterConfig.GlobalSettings.Scan(assembly);
        return services;
    }
}