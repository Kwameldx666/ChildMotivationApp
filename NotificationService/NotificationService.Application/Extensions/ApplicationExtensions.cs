using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NotificationService.Application.Services;

namespace NotificationService.Application.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => 
            cfg.RegisterServicesFromAssembly(typeof(ApplicationExtensions).Assembly));
        
        services.AddSingleton<IConnectionManager, ConnectionManager>();
        services.AddScoped<INotificationService, Services.NotificationService>();
        
        // InMemory storage is used as fallback only if Infrastructure doesn't register a DB-backed one
        services.TryAddSingleton<INotificationStorageService, InMemoryNotificationStorageService>();
        
        return services;
    }
}
