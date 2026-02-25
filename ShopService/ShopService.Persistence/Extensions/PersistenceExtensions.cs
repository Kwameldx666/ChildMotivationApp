using Microsoft.EntityFrameworkCore;
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

        services.AddDbContext<ShopDbContext>(options => options.UseNpgsql(conn));
        services.AddMemoryCache();
        services.AddScoped<IProductStore, EfProductStore>();
        services.AddScoped<IOrderStore, EfOrderStore>();

        return services;
    }
}
