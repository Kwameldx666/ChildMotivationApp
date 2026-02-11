using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NotificationService.Application.Services;
using NotificationService.Infrastructure.Persistence;
using NotificationService.Infrastructure.Services;

namespace NotificationService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Register PostgreSQL DbContext
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddDbContext<NotificationDbContext>(options =>
                options.UseNpgsql(connectionString));

            // Register DB-backed notification storage
            services.AddScoped<INotificationStorageService, PostgresNotificationStorageService>();
        }

        // Register SignalR notification sender
        services.AddScoped<INotificationSender, SignalRNotificationSender>();
        
        return services;
    }
}
