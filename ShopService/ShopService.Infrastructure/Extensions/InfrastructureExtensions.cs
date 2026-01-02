using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ShopService.Infrastructure.Abstractions;
using ShopService.Infrastructure.Services;

namespace ShopService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.TryAddSingleton<IProductStore, InMemoryProductStore>();
        services.TryAddSingleton<IOrderStore>(sp => new InMemoryOrderStore(sp.GetRequiredService<IProductStore>()));
        return services;
    }
}
