using System;
using AuthService.Domain.Entities;
using AuthService.Persistence.Context;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Persistence.Extensions;

public static class PersistenceExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureDatabase(configuration);
        services.AddDataProtection();
        services.ConfigureIdentity();
        return services;
    }
    
    private static void ConfigureDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AuthDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));
        });
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
            .AddDefaultTokenProviders();
    }
    
    //TODO: Add extension to repositories
}

