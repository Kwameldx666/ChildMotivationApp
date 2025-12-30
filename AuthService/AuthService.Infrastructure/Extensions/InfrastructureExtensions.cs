using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Abstractions.Authentication.Internal;
using AuthService.Domain.Entities;
using AuthService.Infrastructure.Common;
using AuthService.Infrastructure.Options.External;
using AuthService.Infrastructure.Options.JwtBearer;
using AuthService.Infrastructure.Services.Authentication.External;
using AuthService.Infrastructure.Services.Authentication.Token;
using AuthService.Infrastructure.Services.Identity;
using AuthService.Infrastructure.Services.OAuth;
using AuthService.Infrastructure.Services.Quartz;
using AuthService.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Quartz;

namespace AuthService.Infrastructure.Extensions;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureIdentity();
        services.ConfigureQuartz(configuration);
        services.ConfigureEndpoints(configuration);
        services.AddDistributedMemoryCache();
        services.AddProxies();
        services.AddCacheStores();
        services.AddMemoryCache();
        services.ValidateConfiguration(configuration);
        services.AddSingleton<IOAuthSessionStore, OAuthSessionStore>();
        services.AddSingleton<OAuthPendingUserStore, OAuthPendingUserStore>();

        services.AddScoped<IExternalLoginSessionBuilder, ExternalLoginSessionBuilder>();
        services.AddScoped<ITokenProvider, JwtBearerProvider>();

        return services;
    }

  private static void ValidateConfiguration(
    this IServiceCollection services,
    IConfiguration configuration)
{
    // =========================
    // JWT bearer configuration
    // =========================
    services.AddOptions<JwtBearerOptions>()
        .Bind(configuration.GetSection("JwtBearer"))
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.Secret),
            "JwtBearer:Secret must be provided.")
        .Validate(
            options => options.AccessTokenLifetime > 0,
            "JwtBearer:AccessTokenLifetime must be greater than zero.")
        .ValidateOnStart();

    // =========================
    // Google OAuth configuration
    // =========================
    services.AddOptions<GoogleOptions>()
        .Bind(configuration.GetSection("Authentication:Google"))
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.ClientSecret),
            "Google ClientSecret must be provided.")
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.ClientId),
            "Google ClientId must be provided.")
        .Validate(
            options => !string.IsNullOrEmpty(options.RedirectUri),
            "Google RedirectUri must be provided.")
        .ValidateOnStart();

    // =========================
    // GitHub OAuth configuration
    // =========================
    services.AddOptions<GitHubOptions>()
        .Bind(configuration.GetSection("Authentication:GitHub"))
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.ClientSecret),
            "GitHub ClientSecret must be provided.")
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.ClientId),
            "GitHub ClientId must be provided.")
        .Validate(
            options => !string.IsNullOrEmpty(options.RedirectUri),
            "GitHub RedirectUri must be provided.")
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.PostSignInRedirectUri),
            "GitHub PostSignInRedirectUri must be provided.")
        .ValidateOnStart();

    // =========================
    // Discord OAuth configuration
    // =========================
    services.AddOptions<DiscordOptions>()
        .Bind(configuration.GetSection("Authentication:Discord"))
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.ClientSecret),
            "Discord ClientSecret must be provided.")
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.ClientId),
            "Discord ClientId must be provided.")
        .Validate(
            options => !string.IsNullOrEmpty(options.RedirectUri),
            "Discord RedirectUri must be provided.")
        .Validate(
            options => !string.IsNullOrWhiteSpace(options.PostSignInRedirectUri),
            "Discord PostSignInRedirectUri must be provided.")
        .ValidateOnStart();
}


    private static void ConfigureEndpoints(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GoogleEndpoints>(configuration.GetSection("ServicesEndpoints:Google"));
        services.Configure<GitHubEndpoints>(configuration.GetSection("ServicesEndpoints:GitHub"));
        services.Configure<DiscordOptions>(configuration.GetSection("ServicesEndpoints:Discord"));
    }

    private static void AddCacheStores(this IServiceCollection services)
    {

        services.AddSingleton<IOAuthPendingUserStore, OAuthPendingUserStore>();
        services.AddSingleton<IOAuthStateStore, DistributedOAuthStateStore>();
        services.AddSingleton<IOAuthSessionStore, OAuthSessionStore>();
    }

    private static void AddProxies(this IServiceCollection services)
    {
        services.AddHttpClient();

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