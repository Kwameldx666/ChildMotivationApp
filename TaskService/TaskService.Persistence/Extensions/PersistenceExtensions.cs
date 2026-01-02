using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaskService.Persistence.Context;
using TaskService.Infrastructure.Abstractions;
using TaskService.Persistence.Repositories;

namespace TaskService.Persistence.Extensions;

public static class PersistenceExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var conn = configuration.GetConnectionString("TaskService");
        if (string.IsNullOrWhiteSpace(conn))
        {
            // fallback to default connection
            conn = configuration.GetConnectionString("DefaultConnection");
        }

        if (string.IsNullOrWhiteSpace(conn))
            throw new InvalidOperationException("Database connection string for TaskService is not configured (ConnectionStrings:TaskService or DefaultConnection)");

        services.AddDbContext<TaskDbContext>(options => options.UseNpgsql(conn));

        // Add in-memory cache for short-term caching
        services.AddMemoryCache();

        // Register EF-backed task store
        services.AddScoped<ITaskStore, EfTaskStore>();

        return services;
    }
}