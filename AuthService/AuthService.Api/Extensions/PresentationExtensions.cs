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
                // Serialize enums as strings instead of numbers
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        services.AddEndpointsApiExplorer();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, builder =>
            {
                builder.WithOrigins(
                    "https://161.35.169.189"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            });
        });
        return services.AddSwaggerGen();
    }
}