using AuthService.Application.Interfaces.Infrastructure;
using AuthService.Application.Interfaces.Infrastructure.Clients;
using AuthService.Application.Interfaces.Infrastructure.Session;
using AuthService.Application.Interfaces.Persistence;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Abstractions.Persistence;
using AuthService.Common.Constants.HttpUrls;
using AuthService.Domain.Entities;
using AuthService.Common.ExternalOptions.SignIn;
using AuthService.Infrastructure.Services.Authentication.Token;
using AuthService.Infrastructure.Services.Clients;
using AuthService.Infrastructure.Services.Identity;
using AuthService.Infrastructure.Services.OAuth;
using AuthService.Infrastructure.Services.User;
using AuthService.Infrastructure.Services.Quartz;
using AuthService.Infrastructure.Services.Session;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Persistence.Context;
using AuthService.Persistence.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Quartz;
using JwtBearerOptions = AuthService.Application.Options.JwtBearerOptions;
using AuthService.Application.Dto.User;
using Microsoft.Extensions.Options;

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

        // IOAuthStateStore: require distributed (Redis) backing only — do not register in-memory or simple fallbacks.
        // Historical duplicate interface mapping is added as a TryAdd to avoid failing startup when IOAuthStateStore is not configured.
        services.TryAddSingleton<AuthService.Application.Interfaces.Infrastructure.IOAuthStateStore>(sp => sp.GetRequiredService<IOAuthStateStore>());

        // Choose state store backing: distributed (Redis) or "no-cache" fallback (no in-memory caching allowed).
        var useDistributed = configuration.GetValue<bool>("Authentication:UseDistributedStateStore");
        if (useDistributed)
        {
            // Prefer a top-level ConnectionStrings:Redis entry for Docker-friendly configuration
            var redisConn = configuration.GetConnectionString("Redis") ?? configuration["Redis:Configuration"] ?? $"{configuration["Redis:Host"] ?? "redis"}:{configuration["Redis:Port"] ?? "6379"}";
            Console.WriteLine($"Infrastructure: UseDistributedStateStore enabled; Redis connection: {redisConn}");
            services.AddStackExchangeRedisCache(options => { options.Configuration = redisConn; options.InstanceName = "auth:"; });

            // Register concrete distributed stores so they can be resolved when Redis is available.
            services.TryAddSingleton<DistributedOAuthStateStore>();
            services.TryAddSingleton<DistributedOAuthSessionStore>();
            services.TryAddSingleton<DistributedOAuthPendingUserStore>();

            // Register interface mappings to distributed implementations.
            services.AddSingleton<IOAuthSessionStore>(sp => sp.GetRequiredService<DistributedOAuthSessionStore>());
            services.AddSingleton<IOAuthPendingUserStore>(sp => sp.GetRequiredService<DistributedOAuthPendingUserStore>());

            // Use a factory for IOAuthStateStore that resolves the distributed implementation only when a working IDistributedCache is present.
            // No in-memory or simple fallback is allowed to avoid accidental memory caching of OAuth state.
            services.AddSingleton<IOAuthStateStore>(sp =>
            {
                var dist = sp.GetService<IDistributedCache>();
                if (dist is not null)
                {
                    // Resolve concrete distributed store (its constructor requires IDistributedCache which is present)
                    return sp.GetRequiredService<DistributedOAuthStateStore>();
                }

                // No in-memory fallback allowed — fail fast and inform user to enable distributed store and configure Redis.
                throw new InvalidOperationException("Distributed cache (Redis) is required for IOAuthStateStore. Enable Authentication:UseDistributedStateStore and configure Redis in 'Redis:Configuration' or 'Redis:Host/Port'.");
            });
        }
        else
        {
            Console.WriteLine("Infrastructure: UseDistributedStateStore disabled; not registering in-memory caches. Using no-op stores for session/pending to avoid memory caching.");

            // Register no-op implementations for session and pending stores to satisfy DI without enabling in-memory caching.
            services.AddSingleton<IOAuthSessionStore, NoopOAuthSessionStore>();
            services.AddSingleton<IOAuthPendingUserStore, NoopOAuthPendingUserStore>();
        }

        // Also register known alternate interface definitions (historical duplicates) explicitly
        // so that handlers referencing different historical namespaces still resolve.
        services.TryAddSingleton<AuthService.Application.Interfaces.Infrastructure.IOAuthStateStore>(sp => sp.GetRequiredService<IOAuthStateStore>());

        services.AddScoped<IExternalLoginSessionBuilder, ExternalLoginSessionBuilder>();
        services.AddScoped<ITokenProvider, JwtBearerProvider>();
        services.AddScoped<IUserManagement, UserManagementService>();

        // Ensure concrete oauth store types are resolvable from the DI container under their interface types.
        // Register concrete type mappings so that concrete class resolution still works when required by factory code.
        services.AddSingleton(sp => (IOAuthPendingUserStore)sp.GetRequiredService<IOAuthPendingUserStore>());
        services.AddSingleton(sp => (IOAuthSessionStore)sp.GetRequiredService<IOAuthSessionStore>());

        // Also register known alternate interface definitions (historical duplicates) explicitly
        // so that handlers referencing different historical namespaces still resolve.
        services.AddSingleton<AuthService.Application.Abstractions.Authentication.External.IOAuthPendingUserStore>(sp => sp.GetRequiredService<IOAuthPendingUserStore>());
        services.AddSingleton<AuthService.Application.Abstractions.Authentication.External.IOAuthSessionStore>(sp => sp.GetRequiredService<IOAuthSessionStore>());
        services.TryAddSingleton<AuthService.Application.Interfaces.Infrastructure.IOAuthStateStore>(sp => sp.GetRequiredService<IOAuthStateStore>());

        // Write a small diagnostic file into the container to make service registrations visible for troubleshooting.
        try
        {
            var interesting = new[]
            {
                "IOAuthPendingUserStore",
                "IOAuthSessionStore",
                "IOAuthStateStore"
            };

            var lines = services
                .Where(sd => sd.ServiceType != null && interesting.Any(k => sd.ServiceType.FullName != null && sd.ServiceType.FullName.Contains(k)))
                .Select(sd => sd.ServiceType.FullName + " -> " + (sd.ImplementationType?.FullName ?? sd.ImplementationFactory?.GetType().FullName ?? "(factory)"))
                .ToArray();

            System.IO.File.WriteAllLines("/tmp/infrastructure-svcdiag.txt", lines);
        }
        catch
        {
            // best-effort diagnostic only
        }

        return services;
    }

    private static void ValidateConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<JwtBearerOptions>()
            .Bind(configuration.GetSection("JwtBearer"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Secret), "JwtBearer:Secret must be provided.")
            .Validate(options => options.AccessTokenLifetime > 0,
                "JwtBearer:AccessTokenLifetime must be greater than zero.")
            ;

        // Expose configured JwtBearer options as the application-level IJwtTokenSettings so
        // handlers that depend on IOptions<IJwtTokenSettings> can be resolved safely.
        // Use a concrete projection from configuration to avoid type/collision issues.
        services.AddSingleton<Microsoft.Extensions.Options.IOptions<AuthService.Application.Abstractions.Authentication.Internal.IJwtTokenSettings>>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>().GetSection("JwtBearer");
            var concrete = new AuthService.Infrastructure.Options.JwtBearer.JwtBearerOptions();
            config.Bind(concrete);
            return Microsoft.Extensions.Options.Options.Create((AuthService.Application.Abstractions.Authentication.Internal.IJwtTokenSettings)concrete);
        });

        // Also register the concrete IJwtTokenSettings instance so that components requesting the interface directly
        // do not cause the DI container to attempt to construct an interface implementation dynamically.
        services.AddSingleton<AuthService.Application.Abstractions.Authentication.Internal.IJwtTokenSettings>(sp =>
            sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AuthService.Application.Abstractions.Authentication.Internal.IJwtTokenSettings>>().Value);

        var googleOpts = services.AddOptions<GoogleOptions>()
            .Bind(configuration.GetSection("Authentication:Google"));

        // Only validate on start when running in container (where envs are expected) or when some values are present in configuration
        var runningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";
        // Do not force ValidateOnStart() for Google options to avoid startup failure when credentials are not provided in some environments.
        // Validation will be performed at runtime when the feature is used.

        // Provide a runtime-safe accessor for IExternalAuthOptions that will attempt to resolve
        // provider-specific options lazily and will not force option validation at registration time.
        services.AddSingleton<IOptions<IExternalAuthOptions>, ExternalAuthOptionsAccessor>();

        var gitHubOpts = services.AddOptions<GitHubOptions>()
            .Bind(configuration.GetSection("Authentication:GitHub"));

        // Do not force ValidateOnStart() for GitHub options to avoid startup failure when credentials are not provided in some environments.
        // Validation will be performed at runtime when the feature is used.

        // Bind Discord options as well (do not ValidateOnStart to avoid hard startup failures when Discord is intentionally unconfigured).
        var discordOpts = services.AddOptions<DiscordOptions>()
            .Bind(configuration.GetSection("Authentication:Discord"));
        // Note: Do not call ValidateOnStart() here; runtime validation/logging will be performed when the provider is used.

        // No host-docker redirect override: always use configured RedirectUri (localhost for local dev).
    }

    private static void ConfigureEndpoints(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GoogleEndpoints>(configuration.GetSection("ServicesEndpoints:Google"));
        services.Configure<GitHubEndpoints>(configuration.GetSection("ServicesEndpoints:GitHub"));
        services.Configure<DiscordEndpoints>(configuration.GetSection("ServicesEndpoints:Discord"));

        // Expose endpoints via the application-level interface for handlers that ask for IOptions<IExternalAuthEndpoints>
        services.AddSingleton<Microsoft.Extensions.Options.IOptions<AuthService.Application.Dto.User.IExternalAuthEndpoints>>(sp =>
            Microsoft.Extensions.Options.Options.Create((AuthService.Application.Dto.User.IExternalAuthEndpoints)sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<GoogleEndpoints>>().Value));
    }

    private static void AddProxies(this IServiceCollection services)
    {
        Console.WriteLine("AddProxies: registering proxy services...");
        services.AddHttpClient();

        services.AddScoped<IGoogleServiceClient, GoogleServiceClient>();

        // Register concrete external auth providers explicitly so that handlers receive provider-specific implementations
        services.AddScoped<AuthService.Application.Abstractions.Authentication.External.IGoogleAuthProvider, AuthService.Infrastructure.Services.Authentication.External.GoogleAuthProvider>();
        services.AddScoped<AuthService.Application.Abstractions.Authentication.External.IGitHubAuthProvider, AuthService.Infrastructure.Services.Authentication.External.GitHubAuthProvider>();

        // Also register the generic IExternalAuthProvider to avoid breaking components that still depend on it.
        // Map it to the Google provider by default for backward compatibility.
        services.AddScoped<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProvider>(sp =>
            sp.GetRequiredService<AuthService.Application.Abstractions.Authentication.External.IGoogleAuthProvider>());

        // Make concrete provider classes directly resolvable (factory will request these by concrete type)
        services.AddScoped<AuthService.Infrastructure.Services.Authentication.External.GoogleAuthProvider>();
        services.AddScoped<AuthService.Infrastructure.Services.Authentication.External.GitHubAuthProvider>();
        // Register Discord provider so factory can resolve it when Discord is used. The provider defers option access until used to avoid startup validation failures.
        services.AddScoped<AuthService.Infrastructure.Services.Authentication.External.DiscordAuthProvider>();
        // Also make Discord available as a generic IExternalAuthProvider implementation so it can be discovered when scanning IExternalAuthProvider instances.
        services.AddScoped<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProvider, AuthService.Infrastructure.Services.Authentication.External.DiscordAuthProvider>();

        // Register factory for choosing proper provider at runtime
        Console.WriteLine("AddProxies: adding IExternalAuthProviderFactory registration");
        // Factory needs to consume scoped provider implementations, register as scoped.
        services.AddScoped<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProviderFactory, AuthService.Infrastructure.Services.Authentication.External.ExternalAuthProviderFactory>();
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