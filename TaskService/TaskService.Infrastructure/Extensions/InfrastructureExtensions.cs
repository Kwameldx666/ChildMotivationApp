using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TaskService.Application.Abstractions;
using TaskService.Infrastructure.Options;
using TaskService.Infrastructure.Services;

namespace TaskService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.TryAddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.Configure<TaskEvidenceStorageOptions>(configuration.GetSection(TaskEvidenceStorageOptions.SectionName));
        services.TryAddSingleton<ITaskEvidenceStorage, FileSystemTaskEvidenceStorage>();
        return services;
    }
}