using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Abstractions.Persistence;
using AuthService.Domain.Entities;
using AuthService.Infrastructure.Services.Authentication.Token;
using AuthService.Infrastructure.Services.Identity;
using AuthService.Infrastructure.Services.User;
using AuthService.Infrastructure.ServicesDto;
using AuthService.Persistence.Context;
using AuthService.Persistence.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace AuthService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<JwtBearerOptions>()
            .Bind(configuration.GetSection("JwtBearer"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Secret), "JwtBearer:Secret must be provided.")
            .Validate(options => options.AccessTokenLifetime > 0,
                "JwtBearer:AccessTokenLifetime must be greater than zero.")
            .ValidateOnStart();

        services.ConfigureIdentity();
        services.AddScoped<ITokenProvider, JwtBearerProvider>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<GenericRepository<RefreshToken, Guid>>();
        services.AddScoped<IUserManagement, UserManagementService>();
        return services;
    }

    private static void ConfigureIdentity(this IServiceCollection services)
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
            .AddDefaultTokenProviders()
            .AddSignInManager();

        services.Replace(ServiceDescriptor.Scoped<IUserValidator<User>, NoOperationUserValidator<User>>());
    }
}