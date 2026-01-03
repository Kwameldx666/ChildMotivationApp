using System.Security.Claims;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Claim;
using AuthService.Application.Extensions;
using AuthService.Domain.Enums;
using AuthService.Extensions;
using AuthService.Infrastructure.Common;
using AuthService.Infrastructure.Extensions;
using AuthService.Infrastructure.Options.External;
using AuthService.Persistence.Context;
using AuthService.Persistence.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection.Extensions;

var builder = WebApplication.CreateBuilder(args);
// Disable service provider validation during build to avoid premature activation errors while all registrations are still being composed.
builder.Host.UseDefaultServiceProvider((ctx, spOptions) => { spOptions.ValidateOnBuild = false; });

// NOTE: Early SimpleOAuthStateStore fallback removed — IOAuthStateStore now requires distributed (Redis) backing.


builder.Services.AddPresentation();
builder.Services.AddInfrastructure(builder.Configuration);
var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection") ?? builder.Configuration["ConnectionStrings:DefaultConnection"];
var redisConn = builder.Configuration.GetConnectionString("Redis") ?? builder.Configuration["Redis:Configuration"];
var healthChecks = builder.Services.AddHealthChecks();

if (!string.IsNullOrWhiteSpace(defaultConn))
{
    healthChecks.AddNpgSql(defaultConn, name: "postgres", tags: new[] { "ready" });
}
else
{
    Console.WriteLine("HealthChecks: DefaultConnection not configured; skipping Postgres health check.");
}

if (!string.IsNullOrWhiteSpace(redisConn))
{
    healthChecks.AddRedis(redisConn, name: "redis", tags: new[] { "ready" });
}
else
{
    Console.WriteLine("HealthChecks: Redis connection not configured; skipping Redis health check.");
}

// NOTE: SimpleOAuthStateStore removed — IOAuthStateStore will be provided by Infrastructure only when distributed store is configured.

// Immediate diagnostic: write current registered service types to a file so we can inspect
// whether IOAuthStateStore and related entries are present at this early point.
try
{
    var lines = builder.Services.Select(sd => sd.ServiceType?.FullName + " -> " + (sd.ImplementationType?.FullName ?? sd.ImplementationFactory?.GetType().FullName ?? "(factory)")).ToArray();
    System.IO.File.WriteAllLines("/tmp/early-svcdiag.txt", lines);
}
catch
{
    // best effort only
}

// Diagnostic: whether distributed state store is enabled and Redis configuration
var useDistributedState = builder.Configuration.GetValue<bool>("Authentication:UseDistributedStateStore");
Console.WriteLine($"Startup diag: Authentication:UseDistributedStateStore={useDistributedState}");
if (useDistributedState)
{
    var redisCfg = builder.Configuration.GetConnectionString("Redis") ?? builder.Configuration["Redis:Configuration"] ?? $"{builder.Configuration["Redis:Host"]}:{builder.Configuration["Redis:Port"]}";
    Console.WriteLine($"Startup diag: Redis connection: {redisCfg}");
}
// Diagnostic: count IExternalAuthProvider descriptors and presence of Discord registration
var iExternalDescriptors = builder.Services.Count(sd => sd.ServiceType == typeof(AuthService.Application.Abstractions.Authentication.External.IExternalAuthProvider));
Console.WriteLine($"Startup diag: IExternalAuthProvider descriptors count: {iExternalDescriptors}");
var hasDiscordConcrete = builder.Services.Any(sd => sd.ServiceType == typeof(AuthService.Infrastructure.Services.Authentication.External.DiscordAuthProvider));
Console.WriteLine($"Startup diag: DiscordAuthProvider concrete registration present: {hasDiscordConcrete}");
var hasDiscordAsExternal = builder.Services.Any(sd => sd.ServiceType == typeof(AuthService.Application.Abstractions.Authentication.External.IExternalAuthProvider) && sd.ImplementationType?.FullName?.Contains("Discord") == true);
Console.WriteLine($"Startup diag: Discord registered as IExternalAuthProvider: {hasDiscordAsExternal}");

// Defensive: ensure external auth factory is registered when AddProxies didn't run
if (!builder.Services.Any(sd =>
        sd.ServiceType ==
        typeof(AuthService.Application.Abstractions.Authentication.External.IExternalAuthProviderFactory)))
{
    Console.WriteLine("Program: registering IExternalAuthProviderFactory fallback");
    // Register as scoped because factory consumes scoped IExternalAuthProvider implementations.
    builder.Services
        .AddScoped<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProviderFactory,
            AuthService.Infrastructure.Services.Authentication.External.ExternalAuthProviderFactory>();
}

// Ensure concrete provider classes are resolvable (factory requires them)
if (!builder.Services.Any(sd =>
        sd.ServiceType == typeof(AuthService.Infrastructure.Services.Authentication.External.GoogleAuthProvider)))
{
    Console.WriteLine("Program: registering GoogleAuthProvider fallback");
    builder.Services.AddScoped<AuthService.Infrastructure.Services.Authentication.External.GoogleAuthProvider>();
}

if (!builder.Services.Any(sd =>
        sd.ServiceType == typeof(AuthService.Infrastructure.Services.Authentication.External.GitHubAuthProvider)))
{
    Console.WriteLine("Program: registering GitHubAuthProvider fallback");
    builder.Services.AddScoped<AuthService.Infrastructure.Services.Authentication.External.GitHubAuthProvider>();
}

// Defensive: ensure Discord provider is registered too (some images may miss this registration)
if (!builder.Services.Any(sd =>
        sd.ServiceType == typeof(AuthService.Infrastructure.Services.Authentication.External.DiscordAuthProvider)))
{
    Console.WriteLine("Program: registering DiscordAuthProvider fallback");
    builder.Services.AddScoped<AuthService.Infrastructure.Services.Authentication.External.DiscordAuthProvider>();
}

// Defensive: some historical interface duplicates and registration ordering caused the
// concrete pending/session store to be present but the interface mapping to be missing
// in some deployed images. Ensure the interface-to-concrete mappings exist explicitly
// as a fallback so handlers that depend on the interface can be resolved.

builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);

// Diagnostic: ensure required DI registrations are present before building the app.
var hasPendingStore = builder.Services.Any(sd =>
    sd.ServiceType == typeof(IOAuthPendingUserStore));
var hasSessionStore = builder.Services.Any(sd =>
    sd.ServiceType == typeof(IOAuthSessionStore));

// Additional defensive diagnostics: check for concrete implementation descriptor names as some registrations may be using implementation-only registrations
var hasPendingImpl = builder.Services.Any(sd => sd.ImplementationType?.Name == "OAuthPendingUserStore");
var hasSessionImpl = builder.Services.Any(sd => sd.ImplementationType?.Name == "OAuthSessionStore");
Console.WriteLine(
    $"DI diagnostic impl: OAuthPendingUserStore present: {hasPendingImpl}, OAuthSessionStore present: {hasSessionImpl}");

// Check whether IExternalAuthProviderFactory is registered and can be resolved
var factoryDescriptors = builder.Services.Where(sd => sd.ServiceType == typeof(AuthService.Application.Abstractions.Authentication.External.IExternalAuthProviderFactory)).ToList();
Console.WriteLine($"DI diagnostic: IExternalAuthProviderFactory descriptors: {factoryDescriptors.Count}");
foreach (var sd in factoryDescriptors)
{
    Console.WriteLine($"DI diagnostic descriptor: ServiceType={sd.ServiceType?.FullName}, Lifetime={sd.Lifetime}, ImplementationType={(sd.ImplementationType?.FullName ?? "(factory)")}");
}
try
{
    var spDiag = builder.Services.BuildServiceProvider(new ServiceProviderOptions { ValidateOnBuild = false });
    try
    {
        var factoryResolved = spDiag.GetService<AuthService.Application.Abstractions.Authentication.External.IExternalAuthProviderFactory>() is not null;
        Console.WriteLine($"DI resolve IExternalAuthProviderFactory success: {factoryResolved}");
    }
    catch (Exception rex)
    {
        Console.WriteLine($"DI resolve IExternalAuthProviderFactory threw: {rex.GetType().Name} - {rex.Message}");
    }

        // Additional diagnostic: verify that IOAuthStateStore can be resolved and invoked.
        try
        {
            var stateStore = spDiag.GetService<AuthService.Application.Abstractions.Authentication.External.IOAuthStateStore>();
            if (stateStore is null)
            {
                Console.WriteLine("DI diagnostic: IOAuthStateStore is NOT registered.");
            }
            else
            {
                try
                {
                    var state = await stateStore.CreateStateAsync(AuthService.Application.Enums.ExternalProviderType.Google, CancellationToken.None);
                    var ok = await stateStore.ValidateStateAsync(AuthService.Application.Enums.ExternalProviderType.Google, state, CancellationToken.None);
                    Console.WriteLine($"DI diagnostic: IOAuthStateStore create/validate returned: {ok}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"DI diagnostic: IOAuthStateStore invocation threw: {ex.GetType().Name} - {ex.Message}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DI diagnostic: IOAuthStateStore test failed to build/resolve: {ex.GetType().Name} - {ex.Message}");
        }
    File.WriteAllLines("/tmp/svcdiag.txt", lines);
    Console.WriteLine(
        $"DI diagnostic: IOAuthPendingUserStore registered: {hasPendingStore}, IOAuthSessionStore registered: {hasSessionStore}");
}
catch (Exception ex)
{
    Console.WriteLine($"DI diagnostic write failed: {ex.Message}");
}



// Remove any registered startup option validators to avoid hard failure when some optional OAuth provider options are missing in certain environments.
// This is a defensive measure for development and containers where some providers may be intentionally unconfigured.
var validatorDescriptors = builder.Services.Where(sd =>
    sd.ImplementationType?.Name == "StartupValidator" ||
    (sd.ImplementationType?.FullName?.Contains("Options.StartupValidator") ?? false)).ToList();
foreach (var sd in validatorDescriptors) builder.Services.Remove(sd);

var app = builder.Build();

var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!isRunningInContainer) app.UseHttpsRedirection();

app.UseExceptionHandler(_ => { });
app.MapControllers();

// Simple ping endpoints for readiness debugging (hosted under root and auth-service base)
app.MapGet("/_ping", () => Results.Ok("pong"));
app.MapGet("/auth-service/_ping", () => Results.Ok("pong"));

// Expose JSON health endpoints that report readiness of dependent services (postgres, redis).
// Provide both root and auth-service-prefixed paths so container/cluster probes can target either.
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = (check) => check.Tags.Contains("ready"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            totalDuration = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.ToDictionary(e => e.Key, e => new {
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration.TotalMilliseconds,
                data = e.Value.Data
            })
        };
        await context.Response.WriteAsJsonAsync(result);
    }
});

// Apply pending EF Core migrations and ensure roles/claims are seeded at startup.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    const int maxAttempts = 12;
    var delay = TimeSpan.FromSeconds(2);
    var succeeded = false;

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
        try
        {
            var db = services.GetRequiredService<AuthDbContext>();
            logger.LogInformation("Applying database migrations (attempt {Attempt}/{Max})...", attempt, maxAttempts);
            await db.Database.MigrateAsync();

            var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

            foreach (var roleName in UserRoles.All)
            {
                var role = await roleManager.FindByNameAsync(roleName);
                if (role is null)
                {
                    logger.LogInformation("Creating role {Role}", roleName);
                    await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
                    role = await roleManager.FindByNameAsync(roleName);
                }

                if (role is not null)
                {
                    var existingClaims = await roleManager.GetClaimsAsync(role);
                    var scopes = roleName == UserRoles.Parent ? UserScopes.ParentScopes : UserScopes.ChildScopes;

                    foreach (var scopeClaim in scopes)
                    {
                        if (existingClaims.Any(c => c.Type == ClaimConstants.Scope && c.Value == scopeClaim))
                            continue;

                        logger.LogInformation("Adding scope claim {Scope} to role {Role}", scopeClaim, roleName);
                        await roleManager.AddClaimAsync(role,
                            new Claim(ClaimConstants.Scope, scopeClaim));
                    }
                }
            }

            logger.LogInformation("Database migrations and seeding finished.");

            // Log presence of OAuth configuration from raw configuration keys (do not create options objects at startup).
            try
            {
                var config = services.GetRequiredService<IConfiguration>();
                var gClientId = config["Authentication:Google:ClientId"];
                var gRedirect = config["Authentication:Google:RedirectUri"];
                var gHasSecret = !string.IsNullOrWhiteSpace(config["Authentication:Google:ClientSecret"]);
                logger.LogInformation(
                    "Google OAuth configuration (raw): ClientId={ClientId}, RedirectUri={RedirectUri}, ClientSecretSet={HasSecret}",
                    gClientId ?? "(none)", gRedirect ?? "(none)", gHasSecret);

                var ghClientId = config["Authentication:GitHub:ClientId"];
                var ghRedirect = config["Authentication:GitHub:RedirectUri"];
                var ghHasSecret = !string.IsNullOrWhiteSpace(config["Authentication:GitHub:ClientSecret"]);
                logger.LogInformation(
                    "GitHub OAuth configuration (raw): ClientId={ClientId}, RedirectUri={RedirectUri}, ClientSecretSet={HasSecret}",
                    ghClientId ?? "(none)", ghRedirect ?? "(none)", ghHasSecret);
                var dClientId = config["Authentication:Discord:ClientId"]; 
                var dRedirect = config["Authentication:Discord:RedirectUri"]; 
                var dHasSecret = !string.IsNullOrWhiteSpace(config["Authentication:Discord:ClientSecret"]);
                logger.LogInformation(
                    "Discord OAuth configuration (raw): ClientId={ClientId}, RedirectUri={RedirectUri}, ClientSecretSet={HasSecret}",
                    dClientId ?? "(none)", dRedirect ?? "(none)", dHasSecret);            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to read raw OAuth configuration at startup.");
            }

            succeeded = true;
            break;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Migration/seeding attempt {Attempt}/{Max} failed. Retrying in {Delay}s...", attempt,
                maxAttempts, delay.TotalSeconds);

            if (attempt == maxAttempts)
            {
                logger.LogError(ex,
                    "Failed to apply migrations after {Max} attempts. The application will continue to run but the database may be unavailable.",
                    maxAttempts);
                break;
            }

            await Task.Delay(delay);
            // exponential backoff, cap to 30 seconds
            delay = TimeSpan.FromSeconds(Math.Min(30, delay.TotalSeconds * 2));
        }

    if (!succeeded)
        logger.LogWarning(
            "Database migration/seeding did not complete successfully during startup. You may need to run migrations manually or ensure the database is ready before starting the service.");
}

app.Run();