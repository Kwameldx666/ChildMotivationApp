using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Application.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration) =>
        ApplicationServiceCollectionExtensions.AddApplication(services);
}