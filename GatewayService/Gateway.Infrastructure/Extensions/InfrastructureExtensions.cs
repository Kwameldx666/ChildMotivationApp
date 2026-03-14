using System.Text;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Handlers;
using Gateway.Infrastructure.Mappings;
using Gateway.Infrastructure.Options;
using Gateway.Infrastructure.Services.Clients;
using Gateway.Infrastructure.Services.Constants;
using Mapster;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Net;
using JwtBearerOptions = Gateway.Infrastructure.Services.Models.JwtBearer.JwtBearerOptions;

namespace Gateway.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddTransient<AuthorizationForwardingHandler>();
        services.AddProxies();
        services.AddAuthentication(configuration);
        services.ConfigureHttpClients(configuration);
        services.ConfigureEndpoints(configuration);

        TypeAdapterConfig.GlobalSettings.Scan(typeof(AuthMappingConfig).Assembly);

        return services;
    }

    private static void ConfigureHttpClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure service options
        services.Configure<AuthServiceOptions>(configuration.GetSection("Services:Auth"));
        services.Configure<UserServiceOptions>(configuration.GetSection("Services:User"));
        services.Configure<TaskServiceOptions>(configuration.GetSection("Services:Task"));
        services.Configure<ShopServiceOptions>(configuration.GetSection("Services:Shop"));
        services.Configure<AiServiceOptions>(configuration.GetSection("Services:Ai"));
        services.Configure<NotificationServiceOptions>(configuration.GetSection("Services:Notification"));

        ConfigureClientWithPolly<AuthServiceOptions>(
            services,
            configuration,
            DefaultHttpClientNames.AuthService,
            "Services:Auth");

        ConfigureClientWithPolly<UserServiceOptions>(
            services,
            configuration,
            DefaultHttpClientNames.UserService,
            "Services:User");

        ConfigureClientWithPolly<TaskServiceOptions>(
            services,
            configuration,
            DefaultHttpClientNames.TaskService,
            "Services:Task");

        ConfigureClientWithPolly<ShopServiceOptions>(
            services,
            configuration,
            DefaultHttpClientNames.ShopService,
            "Services:Shop");

        ConfigureClientWithPolly<AiServiceOptions>(
            services,
            configuration,
            DefaultHttpClientNames.AiService,
            "Services:Ai");

        ConfigureClientWithPolly<NotificationServiceOptions>(
            services,
            configuration,
            DefaultHttpClientNames.NotificationService,
            "Services:Notification");
    }

    private static void ConfigureClientWithPolly<TOptions>(
        IServiceCollection services,
        IConfiguration configuration,
        string clientName,
        string configKey)
        where TOptions : ServiceOptions
    {
        var options = configuration.GetSection(configKey).Get<TOptions>();
        var baseUrl = options?.BaseUrl ?? "http://localhost";
        var timeoutSeconds = options?.TimeoutSeconds ?? 30;

        services.AddHttpClient(clientName, client =>
            {
                client.BaseAddress = new Uri(baseUrl);
                client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
            })
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
                PooledConnectionLifetime = TimeSpan.FromMinutes(10),
                PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2),
                MaxConnectionsPerServer = 512,
                EnableMultipleHttp2Connections = true
            })
            .AddHttpMessageHandler<AuthorizationForwardingHandler>();
    }

    private static void ConfigureEndpoints(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AuthEndpoints>(configuration.GetSection("ServiceEndpoints:AuthService"));
        services.Configure<UserEndpoints>(configuration.GetSection("ServiceEndpoints:UserService"));
        services.Configure<TaskEndpoints>(configuration.GetSection("ServiceEndpoints:TaskService"));
        services.Configure<ShopEndpoints>(configuration.GetSection("ServiceEndpoints:ShopService"));
        services.Configure<AiEndpoints>(configuration.GetSection("ServiceEndpoints:AiService"));
        services.Configure<NotificationEndpoints>(configuration.GetSection("ServiceEndpoints:NotificationService"));
    }

    private static void AddProxies(this IServiceCollection services)
    {
        services.AddScoped<IAuthServiceClient, AuthServiceClient>();
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<ITaskServiceClient, TaskServiceClient>();
        services.AddScoped<IShopServiceClient, ShopServiceClient>();
        services.AddScoped<IAiServiceClient, AiServiceClient>();
        services.AddScoped<IFamilyChatClient, FamilyChatClient>();
        services.AddScoped<INotificationServiceClient, NotificationServiceClient>();
    }

    private static void AddAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection("JwtBearer").Get<JwtBearerOptions>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt!.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
                options.MapInboundClaims = false;
            });

        services.Configure<JwtBearerOptions>(configuration.GetSection("JwtBearer"));
    }
}