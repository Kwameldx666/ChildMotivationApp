using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShopService.Infrastructure.Abstractions;
using ShopService.Persistence.Context;
using ShopService.Persistence.Repositories;

namespace ShopService.Persistence.Extensions;

public static class PersistenceExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var conn = configuration.GetConnectionString("ShopService") ?? configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(conn))
            throw new InvalidOperationException("ConnectionStrings:ShopService (or DefaultConnection) is required for ShopService");

        services.AddDbContext<ShopDbContext>(options =>
        {
            options.UseNpgsql(conn, npgsql =>
            {
                npgsql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(2), null);
                npgsql.CommandTimeout(15);
            });

            // Keep model-change warning suppressed for local migration workflow.
            options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        });
        services.AddMemoryCache();
        services.AddScoped<IProductStore, EfProductStore>();
        services.AddScoped<IOrderStore, EfOrderStore>();

        return services;
    }
}
