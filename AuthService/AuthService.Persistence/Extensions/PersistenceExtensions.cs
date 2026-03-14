using AuthService.Application.Abstractions.Persistence;
using AuthService.Domain.Entities;
using AuthService.Persistence.Context;
using AuthService.Persistence.HostedServices;
using AuthService.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Persistence.Extensions;

public static class PersistenceExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureDatabase(configuration);
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<GenericRepository<RefreshToken, Guid>>();
        services.AddDataProtection();
        services.AddHostedService<AuthDatabaseInitializer>();

        return services;
    }

    private static void ConfigureDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AuthDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"), npgsql =>
            {
                npgsql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(2), null);
                npgsql.CommandTimeout(15);
            });
        });
    }
}