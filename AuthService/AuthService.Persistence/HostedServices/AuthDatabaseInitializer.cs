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

    // Family 2 — Петровы
    public static readonly Guid DemoParent2Id  = Guid.Parse("a2000000-0000-0000-0000-000000000001");
    public static readonly Guid DemoChild3Id   = Guid.Parse("a2000000-0000-0000-0000-000000000002");
    public static readonly Guid DemoChild4Id   = Guid.Parse("a2000000-0000-0000-0000-000000000003");

    // Family 3 — Сидоровы
    public static readonly Guid DemoParent3Id  = Guid.Parse("a3000000-0000-0000-0000-000000000001");
    public static readonly Guid DemoChild5Id   = Guid.Parse("a3000000-0000-0000-0000-000000000002");
    public static readonly Guid DemoChild6Id   = Guid.Parse("a3000000-0000-0000-0000-000000000003");

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

        // ── Demo Family 2: Петровы ───────────────────────────────
        const string parent2Email  = "demo2@familyquest.app";
        const string familyCode2   = "DEMO02";
        const string familyName2   = "Семья Петровых";
        const string familyEmblem2 = "🌟";
        const string child3Login   = "maxim_demo";
        const string child4Login   = "sonya_demo";

        if (await userManager.FindByEmailAsync(parent2Email) is null)
        {
            var parent2 = new User
            {
                Id             = DemoParent2Id,
                Email          = parent2Email,
                UserName       = parent2Email,
                EmailConfirmed = true,
                FamilyCode     = familyCode2,
                FamilyName     = familyName2,
                FamilyEmblem   = familyEmblem2,
                UserStatus     = UserStatuses.Active,
                Avatar         = "👩",
                UserType       = UserType.Parent,
                Name           = "Ольга",
                LastName       = "Петрова",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(parent2, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(parent2, UserRoles.Parent);
            else
                logger.LogWarning("Demo parent2 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        if (await userManager.FindByNameAsync(child3Login) is null)
        {
            var child3 = new User
            {
                Id             = DemoChild3Id,
                UserName       = child3Login,
                EmailConfirmed = true,
                FamilyCode     = familyCode2,
                FamilyName     = familyName2,
                FamilyEmblem   = familyEmblem2,
                UserStatus     = UserStatuses.Active,
                Avatar         = "🚀",
                Age            = 11,
                UserType       = UserType.Child,
                Name           = "Максим",
                LastName       = "Петров",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(child3, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(child3, UserRoles.Child);
            else
                logger.LogWarning("Demo child3 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        if (await userManager.FindByNameAsync(child4Login) is null)
        {
            var child4 = new User
            {
                Id             = DemoChild4Id,
                UserName       = child4Login,
                EmailConfirmed = true,
                FamilyCode     = familyCode2,
                FamilyName     = familyName2,
                FamilyEmblem   = familyEmblem2,
                UserStatus     = UserStatuses.Active,
                Avatar         = "🦋",
                Age            = 9,
                UserType       = UserType.Child,
                Name           = "Соня",
                LastName       = "Петрова",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(child4, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(child4, UserRoles.Child);
            else
                logger.LogWarning("Demo child4 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        // ── Demo Family 3: Сидоровы ──────────────────────────────
        const string parent3Email  = "demo3@familyquest.app";
        const string familyCode3   = "DEMO03";
        const string familyName3   = "Семья Сидоровых";
        const string familyEmblem3 = "🦁";
        const string child5Login   = "artem_demo";
        const string child6Login   = "liza_demo";

        if (await userManager.FindByEmailAsync(parent3Email) is null)
        {
            var parent3 = new User
            {
                Id             = DemoParent3Id,
                Email          = parent3Email,
                UserName       = parent3Email,
                EmailConfirmed = true,
                FamilyCode     = familyCode3,
                FamilyName     = familyName3,
                FamilyEmblem   = familyEmblem3,
                UserStatus     = UserStatuses.Active,
                Avatar         = "👨‍💼",
                UserType       = UserType.Parent,
                Name           = "Дмитрий",
                LastName       = "Сидоров",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(parent3, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(parent3, UserRoles.Parent);
            else
                logger.LogWarning("Demo parent3 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        if (await userManager.FindByNameAsync(child5Login) is null)
        {
            var child5 = new User
            {
                Id             = DemoChild5Id,
                UserName       = child5Login,
                EmailConfirmed = true,
                FamilyCode     = familyCode3,
                FamilyName     = familyName3,
                FamilyEmblem   = familyEmblem3,
                UserStatus     = UserStatuses.Active,
                Avatar         = "⚡",
                Age            = 12,
                UserType       = UserType.Child,
                Name           = "Артём",
                LastName       = "Сидоров",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(child5, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(child5, UserRoles.Child);
            else
                logger.LogWarning("Demo child5 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }

        if (await userManager.FindByNameAsync(child6Login) is null)
        {
            var child6 = new User
            {
                Id             = DemoChild6Id,
                UserName       = child6Login,
                EmailConfirmed = true,
                FamilyCode     = familyCode3,
                FamilyName     = familyName3,
                FamilyEmblem   = familyEmblem3,
                UserStatus     = UserStatuses.Active,
                Avatar         = "🌺",
                Age            = 7,
                UserType       = UserType.Child,
                Name           = "Лиза",
                LastName       = "Сидорова",
                MustChangePassword = false,
            };
            var result = await userManager.CreateAsync(child6, demoPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(child6, UserRoles.Child);
            else
                logger.LogWarning("Demo child6 creation failed: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }
    }
}