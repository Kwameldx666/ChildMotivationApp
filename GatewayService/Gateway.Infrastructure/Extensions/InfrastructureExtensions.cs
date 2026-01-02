using System.Text;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Handlers;
using Gateway.Infrastructure.Mappings;
using Gateway.Infrastructure.Services.Clients;
using Gateway.Infrastructure.Services.Constants;
using Mapster;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using JwtBearerOptions = Gateway.Infrastructure.Services.Models.JwtBearer.JwtBearerOptions;

namespace Gateway.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddProxies();
        services.AddAuthentication(configuration);
        services.AddSwaggerGenWithAuth();
        services.ConfigureHttpClients(configuration);
        services.ConfigureEndpoints(configuration);

        TypeAdapterConfig.GlobalSettings.Scan(typeof(AuthMappingConfig).Assembly);

        return services;
    }

    private static void ConfigureHttpClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ConfigureClient(
            services,
            configuration,
            DefaultHttpClientNames.AuthService,
            "Services:AuthService",
            "http://localhost:7265");

        ConfigureClient(
            services,
            configuration,
            DefaultHttpClientNames.UserService,
            "Services:UserService",
            "http://localhost:5110");

        ConfigureClient(
            services,
            configuration,
            DefaultHttpClientNames.TaskService,
            "Services:TaskService",
            "http://localhost:8083");

        ConfigureClient(
            services,
            configuration,
            DefaultHttpClientNames.ShopService,
            "Services:ShopService",
            "http://localhost:8091");
    }
    
    private static void ConfigureClient(
        IServiceCollection services,
        IConfiguration configuration,
        string clientName,
        string configKey,
        string defaultAddress)
    {
        var baseAddress = GetBaseAddress(configuration, configKey, defaultAddress);

        services.AddHttpClient(clientName, client =>
                client.BaseAddress = new Uri(baseAddress))
            .AddHttpMessageHandler<AuthorizationForwardingHandler>();
    }

    private static string GetBaseAddress(
        IConfiguration configuration,
        string key,
        string fallback)
    {
        var address = configuration[key];

        if (string.IsNullOrWhiteSpace(address))
            return fallback;

        try
        {
            var uri = new Uri(address);
            // Respect the configured host/port/scheme as provided (do not force localhost).
            return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        }
        catch
        {
            return fallback;
        }
    }

    private static void ConfigureEndpoints(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AuthEndpoints>(configuration.GetSection("ServiceEndpoints:AuthService"));
        services.Configure<UserEndpoints>(configuration.GetSection("ServiceEndpoints:UserService"));
        services.Configure<TaskEndpoints>(configuration.GetSection("ServiceEndpoints:TaskService"));
        services.Configure<ShopEndpoints>(configuration.GetSection("ServiceEndpoints:ShopService"));
    }

    private static void AddProxies(this IServiceCollection services)
    {
        services.AddScoped<IAuthServiceClient, AuthServiceClient>();
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<ITaskServiceClient, TaskServiceClient>();
        services.AddScoped<IShopServiceClient, ShopServiceClient>();
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

    private static void AddSwaggerGenWithAuth(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = JwtBearerDefaults.AuthenticationScheme.ToLower(),
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Введите: Bearer {your JWT token}"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
    }
}