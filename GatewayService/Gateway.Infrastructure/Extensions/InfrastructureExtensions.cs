using System.Collections.Generic;
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
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using JwtBearerOptions = Gateway.Infrastructure.Services.JwtBearer.JwtBearerOptions;

namespace Gateway.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddProxies();
        services.AddAuthentication(configuration);
        services.AddAuthorization();
        services.AddSwaggerGenWithAuth();

        services.AddTransient<AuthorizationForwardingHandler>();

        services.AddHttpClient(DefaultHttpClientNames.AuthService, client =>
        {
            var baseAddress = configuration["Services:AuthService"];

            client.BaseAddress = new Uri(baseAddress!);
        }).AddHttpMessageHandler<AuthorizationForwardingHandler>();

        services.Configure<AuthEndpoints>(configuration.GetSection("ServiceEndpoints:AuthService"));

        TypeAdapterConfig.GlobalSettings.Scan(typeof(AuthMappingConfig).Assembly);

        return services;
    }

    private static void AddProxies(this IServiceCollection services)
    {
        services.AddScoped<IAuthServiceClient, AuthServiceClient>();
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
            var schemeName = JwtBearerDefaults.AuthenticationScheme;

            options.AddSecurityDefinition(schemeName, new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "JWT Authorization header using the Bearer scheme.",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = schemeName.ToLower(),
                BearerFormat = "JWT"
            });

            options.AddSecurityRequirement(document =>
            {
                var schemeReference = new OpenApiSecuritySchemeReference(
                    referenceId: schemeName,
                    hostDocument: document,
                    externalResource: null)
                {
                    Reference = new OpenApiReferenceWithDescription
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = schemeName
                    }
                };

                var requirement = new OpenApiSecurityRequirement();
                requirement.Add(schemeReference, new List<string>());   

                return requirement;
            });
        });
    }
}