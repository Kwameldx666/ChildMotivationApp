using System.Security.Claims;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Claim;
using AuthService.Application.Extensions;
using AuthService.Domain.Enums;
using AuthService.Extensions;
using AuthService.Infrastructure.Extensions;
using AuthService.Infrastructure.Services.Authentication.External;
using AuthService.Persistence.Context;
using AuthService.Persistence.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Регистрация сервисов
builder.Services.AddPresentation();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);

// Регистрация OAuth провайдеров
builder.Services.AddScoped<GoogleAuthProvider>();
builder.Services.AddScoped<GitHubAuthProvider>();
builder.Services.AddSingleton<IExternalAuthProviderFactory, ExternalAuthProviderFactory>();

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseExceptionHandler(_ => { });
app.MapControllers();

// Применение миграций и создание ролей/claims
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var db = services.GetRequiredService<AuthDbContext>();
    await db.Database.MigrateAsync();

    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

    foreach (var roleName in UserRoles.All)
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role is null)
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            role = await roleManager.FindByNameAsync(roleName);
        }

        if (role != null)
        {
            var existingClaims = await roleManager.GetClaimsAsync(role);
            var scopes = roleName == UserRoles.Parent ? UserScopes.ParentScopes : UserScopes.ChildScopes;

            foreach (var scopeClaim in scopes)
                if (!existingClaims.Any(c => c.Type == ClaimConstants.Scope && c.Value == scopeClaim))
                    await roleManager.AddClaimAsync(role, new Claim(ClaimConstants.Scope, scopeClaim));
        }
    }
}

app.Run();