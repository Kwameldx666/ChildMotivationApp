using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TaskService.Infrastructure.Abstractions;
using TaskService.Infrastructure.Services;

namespace TaskService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Provide an in-memory fallback implementation only when no persistence store is registered.
        services.TryAddSingleton<ITaskStore, InMemoryTaskStore>();
        return services;
    }
}