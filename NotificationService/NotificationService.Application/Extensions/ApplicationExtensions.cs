using Microsoft.Extensions.DependencyInjection;
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
        
        // Notification storage (Singleton for In-Memory, replace with Scoped for DB)
        services.AddSingleton<INotificationStorageService, InMemoryNotificationStorageService>();
        
        return services;
    }
}
