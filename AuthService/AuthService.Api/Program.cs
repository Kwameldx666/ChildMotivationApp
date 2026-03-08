using System.Security.Claims;
using AuthService.Application.Claim;
using AuthService.Application.Extensions;
using AuthService.Domain.Enums;
using AuthService.Extensions;
using AuthService.Infrastructure.Extensions;
using AuthService.Persistence.Context;
using AuthService.Persistence.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddPresentation();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddHealthChecks();

var app = builder.Build();

var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!isRunningInContainer) app.UseHttpsRedirection();

app.UseCors(AuthService.Extensions.PresentationExtensions.CorsPolicyName);
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

            // ── Seed demo family for screenshots ──
            try
            {
                var userManager = services.GetRequiredService<UserManager<AuthService.Domain.Entities.User>>();
                var demoParentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
                var existing = await userManager.FindByIdAsync(demoParentId.ToString());
                if (existing is null)
                {
                    logger.LogInformation("Seeding demo family...");

                    var parent = new AuthService.Domain.Entities.User
                    {
                        Id = demoParentId,
                        UserName = "demo.parent@example.com",
                        Email = "demo.parent@example.com",
                        EmailConfirmed = true,
                        Name = "Алексей",
                        LastName = "Иванов",
                        FamilyCode = "DEMO2025",
                        FamilyName = "Семья Ивановых",
                        FamilyEmblem = "shield",
                        UserType = UserType.Parent,
                        UserStatus = "active",
                        Avatar = "👨",
                    };
                    var r1 = await userManager.CreateAsync(parent, "Demo123!");
                    if (r1.Succeeded) await userManager.AddToRoleAsync(parent, UserRoles.Parent);

                    var child1 = new AuthService.Domain.Entities.User
                    {
                        Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                        UserName = "masha.ivanova@example.com",
                        Email = "masha.ivanova@example.com",
                        EmailConfirmed = true,
                        Name = "Маша",
                        LastName = "Иванова",
                        FamilyCode = "DEMO2025",
                        FamilyName = "Семья Ивановых",
                        FamilyEmblem = "shield",
                        UserType = UserType.Child,
                        UserStatus = "active",
                        Avatar = "👧",
                        Age = 10,
                    };
                    var r2 = await userManager.CreateAsync(child1, "Demo123!");
                    if (r2.Succeeded) await userManager.AddToRoleAsync(child1, UserRoles.Child);

                    var child2 = new AuthService.Domain.Entities.User
                    {
                        Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                        UserName = "dima.ivanov@example.com",
                        Email = "dima.ivanov@example.com",
                        EmailConfirmed = true,
                        Name = "Дима",
                        LastName = "Иванов",
                        FamilyCode = "DEMO2025",
                        FamilyName = "Семья Ивановых",
                        FamilyEmblem = "shield",
                        UserType = UserType.Child,
                        UserStatus = "active",
                        Avatar = "👦",
                        Age = 8,
                    };
                    var r3 = await userManager.CreateAsync(child2, "Demo123!");
                    if (r3.Succeeded) await userManager.AddToRoleAsync(child2, UserRoles.Child);

                    logger.LogInformation("Demo family seeded: parent={P}, child1={C1}, child2={C2}",
                        r1.Succeeded, r2.Succeeded, r3.Succeeded);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to seed demo family");
            }

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