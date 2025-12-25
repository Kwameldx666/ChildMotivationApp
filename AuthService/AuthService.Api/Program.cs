using AuthService.Application.Extensions;
using AuthService.Extensions;
using AuthService.Infrastructure.Extensions;
using AuthService.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using AuthService.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using AuthService.Common.Constants.Claim;
using Microsoft.Extensions.Options;
using AuthService.Common.ExternalOptions.SignIn;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddPresentation();
builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);

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

            // Log Google OAuth configuration for diagnostics (do not log the secret itself)
            try
            {
                var googleOptions = services.GetRequiredService<IOptions<GoogleOptions>>().Value;
                var maskedSecret = string.IsNullOrWhiteSpace(googleOptions.ClientSecret)
                    ? "(not set)"
                    : "****REDACTED****";
                logger.LogInformation(
                    "Google OAuth configuration: ClientId={ClientId}, RedirectUri={RedirectUri}, ClientSecretSet={HasSecret}",
                    googleOptions.ClientId, googleOptions.RedirectUri, maskedSecret);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to read Google options at startup.");
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