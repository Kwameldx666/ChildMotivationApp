using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Http;
using TaskService.Application.Abstractions;
using TaskService.Infrastructure.Options;
using TaskService.Infrastructure.Services;
using TaskService.Infrastructure.Clients;

namespace TaskService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.TryAddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.Configure<TaskEvidenceStorageOptions>(configuration.GetSection(TaskEvidenceStorageOptions.SectionName));
        services.TryAddSingleton<ITaskEvidenceStorage, FileSystemTaskEvidenceStorage>();
        
        // Add HTTP client for NotificationService
        services.AddHttpClient<INotificationClient, NotificationClient>(client =>
        {
            var notificationServiceUrl = configuration["Services:Notification:BaseUrl"] ?? "http://notification-service:8080";
            client.BaseAddress = new Uri(notificationServiceUrl);
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        
        return services;
    }
}