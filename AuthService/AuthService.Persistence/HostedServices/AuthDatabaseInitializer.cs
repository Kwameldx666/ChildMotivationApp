using System.Security.Claims;
using AuthService.Application.Claim;
using AuthService.Application.User;
using AuthService.Domain.Entities;
using AuthService.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AuthService.Persistence.HostedServices;

public class AuthDatabaseInitializer(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<AuthDatabaseInitializer> logger) : IHostedService
{
    // Fixed IDs so TaskService can seed tasks referencing these users
    public static readonly Guid DemoParentId   = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    public static readonly Guid DemoChild1Id   = Guid.Parse("a1000000-0000-0000-0000-000000000002");
    public static readonly Guid DemoChild2Id   = Guid.Parse("a1000000-0000-0000-0000-000000000003");

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogInformation("DefaultConnection is not configured. Skipping database initialization.");
            return;
        }

        using var scope = serviceProvider.CreateScope();
        var scopedProvider = scope.ServiceProvider;

        var roleManager = scopedProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        await EnsureRolesAsync(roleManager);

        var userManager = scopedProvider.GetRequiredService<UserManager<User>>();
        await EnsureDemoUsersAsync(userManager, logger);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static async Task EnsureRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
    {
        foreach (var role in UserRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));

            await EnsureRoleScopesAsync(roleManager, role);
        }
    }

    private static async Task EnsureRoleScopesAsync(RoleManager<IdentityRole<Guid>> roleManager, string roleName)
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role is null) return;

        var existingClaims = await roleManager.GetClaimsAsync(role);
        var scopes = roleName == UserRoles.Parent ? UserScopes.ParentScopes : UserScopes.ChildScopes;

        foreach (var scope in scopes)
        {
            if (existingClaims.Any(c => c.Type == ClaimConstants.Scope && c.Value == scope)) continue;
            await roleManager.AddClaimAsync(role, new Claim(ClaimConstants.Scope, scope));
        }
    }

    private static async Task EnsureDemoUsersAsync(UserManager<User> userManager, ILogger logger)
    {
        const string demoPassword    = "Demo1234!";
        const string familyCode      = "DEMO01";
        const string familyName      = "Семья Ивановых";
        const string familyEmblem    = "🏠";
        const string parentEmail     = "demo@familyquest.app";
        const string child1Login     = "nikita_demo";
        const string child2Login     = "masha_demo";

        // ── Demo Parent ────────────────────────────────────────
        if (await userManager.FindByEmailAsync(parentEmail) is null)
        {
            var parent = new User
            {
                Id             = DemoParentId,
                Email          = parentEmail,
                UserName       = parentEmail,
                EmailConfirmed = true,
                FamilyCode     = familyCode,
                FamilyName     = familyName,
                FamilyEmblem   = familyEmblem,
                UserStatus     = UserStatuses.Active,
                Avatar         = "😊",
                UserType       = UserType.Parent,
                Name           = "Алексей",
                LastName       = "Иванов",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(parent, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(parent, UserRoles.Parent);
            else
                logger.LogWarning("Demo parent creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        // ── Demo Child 1: Никита ────────────────────────────────
        if (await userManager.FindByNameAsync(child1Login) is null)
        {
            var child1 = new User
            {
                Id             = DemoChild1Id,
                UserName       = child1Login,
                EmailConfirmed = true,
                FamilyCode     = familyCode,
                FamilyName     = familyName,
                FamilyEmblem   = familyEmblem,
                UserStatus     = UserStatuses.Active,
                Avatar         = "🤖",
                Age            = 10,
                UserType       = UserType.Child,
                Name           = "Никита",
                LastName       = "Иванов",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(child1, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(child1, UserRoles.Child);
            else
                logger.LogWarning("Demo child1 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        // ── Demo Child 2: Маша ──────────────────────────────────
        if (await userManager.FindByNameAsync(child2Login) is null)
        {
            var child2 = new User
            {
                Id             = DemoChild2Id,
                UserName       = child2Login,
                EmailConfirmed = true,
                FamilyCode     = familyCode,
                FamilyName     = familyName,
                FamilyEmblem   = familyEmblem,
                UserStatus     = UserStatuses.Active,
                Avatar         = "🦊",
                Age            = 8,
                UserType       = UserType.Child,
                Name           = "Маша",
                LastName       = "Иванова",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(child2, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(child2, UserRoles.Child);
            else
                logger.LogWarning("Demo child2 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }
    }
}