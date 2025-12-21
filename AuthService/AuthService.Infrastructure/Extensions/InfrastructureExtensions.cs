using System;
using System.Text;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Domain.Entities;
using AuthService.Infrastructure.Services.Identity;
using AuthService.Infrastructure.Services.JwtBearer;
using AuthService.Persistence.Context;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using JwtBearerOptions = AuthService.Infrastructure.Services.JwtBearer.JwtBearerOptions;

namespace AuthService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<JwtBearerOptions>()
            .Bind(configuration.GetSection("JwtBearer"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Secret), "JwtBearer:Secret must be provided.")
            .Validate(options => options.AccessTokenLifetime > 0, "JwtBearer:AccessTokenLifetime must be greater than zero.")
            .ValidateOnStart();

        services.ConfigureIdentity(configuration);
        services.AddAuthorization();
        services.AddScoped<ITokenProvider, JwtBearerProvider>();
        return services;
    }
    
    private static void ConfigureIdentity(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddIdentityCore<User>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AuthDbContext>()
            .AddDefaultTokenProviders();
        
        services.Replace(ServiceDescriptor.Scoped<IUserValidator<User>, NoOperationUserValidator<User>>());
        
        var jwt = configuration.GetSection("JwtBearer").Get<JwtBearerOptions>()
                  ?? throw new InvalidOperationException("JwtBearer configuration section is missing or invalid.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new()
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
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

