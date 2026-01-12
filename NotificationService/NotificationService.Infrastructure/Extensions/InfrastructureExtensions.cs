using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NotificationService.Application.Services;
using NotificationService.Infrastructure.Services;

namespace NotificationService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Register SignalR notification sender
        services.AddScoped<INotificationSender, SignalRNotificationSender>();
        
        return services;
    }
}
