using System.Security.Claims;
using AuthService.Application.Claim;
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
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    private static async Task EnsureRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
    {
        foreach (var role in UserRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role)) await roleManager.CreateAsync(new IdentityRole<Guid>(role));

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
            if (existingClaims.Any(claim => claim.Type == ClaimConstants.Scope && claim.Value == scope)) continue;

            await roleManager.AddClaimAsync(role, new Claim(ClaimConstants.Scope, scope));
        }
    }
}