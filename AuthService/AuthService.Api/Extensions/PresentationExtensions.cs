using AuthService.Middlewares;
using Mapster;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AuthService.Extensions;

public static class PresentationExtensions
{
    public const string CorsPolicyName = "AuthServiceCorsPolicy";

    public static IServiceCollection AddPresentation(this IServiceCollection services)
    {
        services.AddMapster();
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
                // Сериализация enum как строки вместо чисел
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        services.AddEndpointsApiExplorer();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, builder =>
            {
                builder.WithOrigins(
                    "http://localhost:3000",
                    "https://localhost:3000",
                    "http://localhost:4000",
                    "https://localhost:4000",
                    "http://localhost:8081",
                    "https://localhost:8081"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            });
        });
        return services.AddSwaggerGen();
    }
}