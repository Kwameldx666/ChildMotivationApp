using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Abstractions.Authentication.Internal;
using AuthService.Domain.Entities;
using AuthService.Infrastructure.Common;
using AuthService.Infrastructure.Options.External;
using AuthService.Infrastructure.Options.JwtBearer;
using AuthService.Infrastructure.Services.Authentication.Token;
using AuthService.Infrastructure.Services.Authentication.External;
using AuthService.Infrastructure.Services.OAuth;
using AuthService.Infrastructure.Services.Quartz;
using AuthService.Infrastructure.Services.Identity;
using AuthService.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Caching.Distributed;
using Quartz;

namespace AuthService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.ValidateConfiguration(configuration);
        services.ConfigureIdentity();
        services.ConfigureQuartz(configuration);
        services.ConfigureEndpoints(configuration);
        services.AddProxies();

        var useDistributed = configuration.GetValue<bool>("Authentication:UseDistributedStateStore");
        if (useDistributed)
        {
            var redisConn = configuration.GetConnectionString("Redis") 
                ?? configuration["Redis:Configuration"] 
                ?? $"{configuration["Redis:Host"] ?? "redis"}:{configuration["Redis:Port"] ?? "6379"}";
            
            services.AddStackExchangeRedisCache(options => 
            { 
                options.ConfigurationOptions = new StackExchange.Redis.ConfigurationOptions
                {
                    EndPoints = { redisConn },
                    ConnectTimeout = 5000,
                    SyncTimeout = 5000,
                    AsyncTimeout = 5000,
                    ConnectRetry = 3,
                    AbortOnConnectFail = false,
                    AllowAdmin = false
                };
                options.InstanceName = "auth:";
            });

            services.TryAddSingleton<DistributedOAuthStateStore>();
            services.TryAddSingleton<DistributedOAuthSessionStore>();
            services.TryAddSingleton<DistributedOAuthPendingUserStore>();

            services.AddSingleton<IOAuthSessionStore>(sp => sp.GetRequiredService<DistributedOAuthSessionStore>());
            services.AddSingleton<IOAuthPendingUserStore>(sp => sp.GetRequiredService<DistributedOAuthPendingUserStore>());
            services.AddSingleton<IOAuthStateStore>(sp =>
            {
                var dist = sp.GetService<IDistributedCache>();
                if (dist is not null)
                    return sp.GetRequiredService<DistributedOAuthStateStore>();

                throw new InvalidOperationException(
                    "Distributed cache (Redis) is required for IOAuthStateStore.");
            });
        }
        else
        {
            services.AddSingleton<IOAuthSessionStore, NoopOAuthSessionStore>();
            services.AddSingleton<IOAuthPendingUserStore, NoopOAuthPendingUserStore>();
        }

        services.AddScoped<IExternalLoginSessionBuilder, ExternalLoginSessionBuilder>();
        services.AddScoped<ITokenProvider, JwtBearerProvider>();

        return services;
    }

    private static void ValidateConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<JwtBearerOptions>()
            .Bind(configuration.GetSection("JwtBearer"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Secret), "JwtBearer:Secret must be provided.")
            .Validate(options => options.AccessTokenLifetime > 0,
                "JwtBearer:AccessTokenLifetime must be greater than zero.");

        services.AddOptions<GoogleOptions>()
            .Bind(configuration.GetSection("Authentication:Google"));

        services.AddOptions<GitHubOptions>()
            .Bind(configuration.GetSection("Authentication:GitHub"));

        services.AddOptions<DiscordOptions>()
            .Bind(configuration.GetSection("Authentication:Discord"));
    }

    private static void ConfigureEndpoints(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GoogleEndpoints>(configuration.GetSection("ServicesEndpoints:Google"));
        services.Configure<GitHubEndpoints>(configuration.GetSection("ServicesEndpoints:GitHub"));
        services.Configure<DiscordEndpoints>(configuration.GetSection("ServicesEndpoints:Discord"));
    }

    private static void AddProxies(this IServiceCollection services)
    {
        services.AddHttpClient(Constants.DefaultHttpClientNames.Google, client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent", "AuthService/1.0");
        });
        
        services.AddHttpClient(Constants.DefaultHttpClientNames.GitHub, client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent", "AuthService/1.0");
        });
        
        services.AddHttpClient(Constants.DefaultHttpClientNames.Discord, client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent", "AuthService/1.0");
        });

        services.AddScoped<IExternalAuthProvider, GoogleAuthProvider>();
        services.AddScoped<IExternalAuthProvider, GitHubAuthProvider>();
        services.AddScoped<IExternalAuthProvider, DiscordAuthProvider>();

        services.AddScoped<IExternalAuthProviderFactory, ExternalAuthProviderFactory>();
    }

    private static void ConfigureQuartz(this IServiceCollection services, IConfiguration configuration)
    {
        var jobOptions = configuration
                             .GetSection("Quartz:CleanJob")
                             .Get<QuartzCleanJobOptions>()
                         ?? throw new InvalidOperationException("Quartz:CleanJob configuration is missing.");

        services.Configure<QuartzCleanJobOptions>(configuration.GetSection("Quartz:CleanJob"));

        services.AddQuartz(quartzConfigurator =>
        {
            var jobKey = new JobKey(jobOptions.Key);

            quartzConfigurator.AddJob<CleanRefreshTokenJob>(jobBuilder =>
                jobBuilder.WithIdentity(jobKey));

            quartzConfigurator.AddTrigger(triggerBuilder =>
                triggerBuilder
                    .ForJob(jobKey)
                    .WithIdentity(jobOptions.IdentityTrigger)
                    .StartNow()
                    .WithSimpleSchedule(schedule =>
                        schedule
                            .WithInterval(TimeSpan.FromHours(jobOptions.IntervalHours))
                            .RepeatForever()));
        });

        services.AddQuartzHostedService(options => { options.WaitForJobsToComplete = true; });
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