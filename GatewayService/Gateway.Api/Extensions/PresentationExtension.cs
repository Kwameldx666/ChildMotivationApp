using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Services.Constants;

namespace Gateway.Extensions;

public static class PresentationExtension
{
    public const string CorsPolicyName = "GatewayCorsPolicy";

    public static void AddPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddServiceEndpointConfiguration(configuration);
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddCorsPolicy(configuration);
        services.AddNamedHttpClientsConfiguration(configuration);
    }

    private static void AddServiceEndpointConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AuthEndpoints>(configuration.GetSection("ServiceEndpoints:AuthService"));
    }

    private static void AddNamedHttpClientsConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient(DefaultHttpClientNames.AuthService, client  =>
        {
            client.BaseAddress = new Uri(configuration["Services:AuthService"]!);
        });
    }

    private static void AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, builder =>
            {
                builder.WithOrigins(allowedOrigins!)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });
    }
}