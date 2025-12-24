using System.Text;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Handlers;
using Gateway.Infrastructure.Mappings;
using Gateway.Infrastructure.Services.Clients;
using Gateway.Infrastructure.Services.Constants;
using Mapster;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols.Configuration;
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

    private static void ConfigureHttpClients(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient(DefaultHttpClientNames.AuthService, client =>
        {
            var baseAddress = configuration["Services:AuthService"];

            client.BaseAddress = new Uri(baseAddress!);
        }).AddHttpMessageHandler<AuthorizationForwardingHandler>();

        services.AddHttpClient(DefaultHttpClientNames.UserService, client =>
        {
            var baseAddress = configuration["Services:UserService"];
            client.BaseAddress = new Uri(baseAddress!);
        }).AddHttpMessageHandler<AuthorizationForwardingHandler>();
    }

    private static void ConfigureEndpoints(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AuthEndpoints>(configuration.GetSection("ServiceEndpoints:AuthService"));
        services.Configure<UserEndpoints>(configuration.GetSection("ServiceEndpoints:UserService"));
    }

    private static void AddProxies(this IServiceCollection services)
    {
        services.AddScoped<IAuthServiceClient, AuthServiceClient>();
        services.AddScoped<IUserServiceClient, UserServiceClient>();
    }

    private static void AddAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection("JwtBearer").Get<JwtBearerOptions>();
        var googleConfiguration = configuration.GetSection("Authentication").Get<GoogleOptions>() ??
                                  throw new InvalidConfigurationException("google configuration not found");


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
            })
            .AddGoogle(options =>
            {
                options.ClientId = googleConfiguration.ClientId;
                options.ClientSecret = googleConfiguration.ClientSecret;
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