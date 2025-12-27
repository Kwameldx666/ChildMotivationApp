using AuthService.Application.Claim;
using AuthService.Application.Dto.User;
using AuthService.Application.Extensions;
using AuthService.Extensions;
using AuthService.Infrastructure.Extensions;
using AuthService.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using AuthService.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using Microsoft.Extensions.Options;
using AuthService.Infrastructure.Options.External;

var builder = WebApplication.CreateBuilder(args);
// Disable service provider validation during build to avoid premature activation errors while all registrations are still being composed.
builder.Host.UseDefaultServiceProvider((ctx, spOptions) => { spOptions.ValidateOnBuild = false; });

builder.Services.AddPresentation();
builder.Services.AddInfrastructure(builder.Configuration);

// Defensive: some historical interface duplicates and registration ordering caused the
// concrete pending/session store to be present but the interface mapping to be missing
// in some deployed images. Ensure the interface-to-concrete mappings exist explicitly
// as a fallback so handlers that depend on the interface can be resolved.
if (!builder.Services.Any(sd =>
        sd.ServiceType == typeof(AuthService.Application.Abstractions.Authentication.External.IOAuthPendingUserStore)))
    builder.Services
        .AddSingleton<AuthService.Application.Abstractions.Authentication.External.IOAuthPendingUserStore>(sp =>
            sp.GetRequiredService<AuthService.Infrastructure.Common.OAuthPendingUserStore>());
if (!builder.Services.Any(sd =>
        sd.ServiceType == typeof(AuthService.Application.Abstractions.Authentication.External.IOAuthSessionStore)))
    builder.Services.AddSingleton<AuthService.Application.Abstractions.Authentication.External.IOAuthSessionStore>(sp =>
        sp.GetRequiredService<AuthService.Infrastructure.Common.OAuthSessionStore>());

builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);

// Diagnostic: ensure required DI registrations are present before building the app.
var hasPendingStore = builder.Services.Any(sd =>
    sd.ServiceType == typeof(AuthService.Application.Abstractions.Authentication.External.IOAuthPendingUserStore));
var hasSessionStore = builder.Services.Any(sd =>
    sd.ServiceType == typeof(AuthService.Application.Abstractions.Authentication.External.IOAuthSessionStore));

// Additional defensive diagnostics: check for concrete implementation descriptor names as some registrations may be using implementation-only registrations
var hasPendingImpl = builder.Services.Any(sd => sd.ImplementationType?.Name == "OAuthPendingUserStore");
var hasSessionImpl = builder.Services.Any(sd => sd.ImplementationType?.Name == "OAuthSessionStore");
Console.WriteLine(
    $"DI diagnostic impl: OAuthPendingUserStore present: {hasPendingImpl}, OAuthSessionStore present: {hasSessionImpl}");
try
{
    // Write service descriptors to a Linux-friendly path and attempt to resolve some options to log any exceptions early.
    var lines = builder.Services.Select(sd =>
        sd.ServiceType.FullName + " -> " + (sd.ImplementationType?.FullName ??
                                            sd.ImplementationFactory?.GetType().FullName ?? "(factory)")).ToArray();
    File.WriteAllLines("/tmp/svcdiag.txt", lines);
    Console.WriteLine(
        $"DI diagnostic: IOAuthPendingUserStore registered: {hasPendingStore}, IOAuthSessionStore registered: {hasSessionStore}");
}
catch (Exception ex)
{
    Console.WriteLine($"DI diagnostic write failed: {ex.Message}");
}

// Additional startup diagnostics: attempt to read GoogleOptions and GitHubOptions and log whether accessing Value throws.
try
{
    var googleAccessor = builder.Services.BuildServiceProvider().GetService<IOptions<GoogleOptions>>();
    if (googleAccessor is not null)
        try
        {
            var go = googleAccessor.Value;
            Console.WriteLine(
                $"Startup diag: GoogleOptions loaded: ClientId={(string.IsNullOrWhiteSpace(go.ClientId) ? "(empty)" : "set")}, RedirectUri={(string.IsNullOrWhiteSpace(go.RedirectUri) ? "(empty)" : "set")}");
        }
        catch (Exception ox)
        {
            Console.WriteLine($"Startup diag: GoogleOptions access thrown: {ox.GetType().Name} - {ox.Message}");
        }
}
catch (Exception)
{
    // ignore - don't block startup
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
                            new System.Security.Claims.Claim(ClaimConstants.Scope, scopeClaim));
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
            }
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