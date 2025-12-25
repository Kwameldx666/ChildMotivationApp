using AuthService.Middlewares;
using Mapster;

namespace AuthService.Extensions;

public static class PresentationExtensions
{
    public static IServiceCollection AddPresentation(this IServiceCollection services)
    {
        services.AddMapster();
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        return services.AddSwaggerGen();
    }
}