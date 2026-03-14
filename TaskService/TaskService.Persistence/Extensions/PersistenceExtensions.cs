using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaskService.Application.Abstractions;
using TaskService.Domain.Repositories;
using TaskService.Persistence.Context;
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

        services.AddDbContext<TaskDbContext>(options => options.UseNpgsql(conn, npgsql =>
        {
            npgsql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(2), null);
            npgsql.CommandTimeout(15);
        }));

        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
        services.AddScoped<IMissionRepository, MissionRepository>();
        services.AddScoped<IMissionProgressRepository, MissionProgressRepository>();
        services.AddScoped<IAchievementRepository, AchievementRepository>();
        services.AddScoped<IAchievementProgressRepository, AchievementProgressRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}