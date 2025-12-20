using AuthService.Application.Behavior;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Application.Extensions;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(ApplicationServiceCollectionExtensions).Assembly;

        services.AddValidatorsFromAssembly(assembly);

        services.AddMediatR(configuration =>
        {
            configuration.RegisterServicesFromAssembly(assembly);
            configuration.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        return services;
    }
}
