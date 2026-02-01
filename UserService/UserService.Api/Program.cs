using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UserService.Api.Authorization;
using UserService.Application.Extensions;
using UserService.Infrastructure.Extensions;
using UserService.Persistence.Context;
using UserService.Persistence.Extensions;

var builder = WebApplication.CreateBuilder(args);

var jwtSection = builder.Configuration.GetSection("JwtBearer");

builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as strings instead of numbers
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.RequireHttpsMetadata = false;
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidIssuer = jwtSection["Issuer"],
			ValidateAudience = true,
			ValidAudience = jwtSection["Audience"],
			ValidateIssuerSigningKey = true,
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Secret"]!)),
			ValidateLifetime = true,
			ClockSkew = TimeSpan.Zero
		};
		options.MapInboundClaims = false;
	});
builder.Services.AddAuthorization(options =>
{
	options.AddPolicy(AuthorizationConstants.UserReadPolicy,
		policy => policy.RequireClaim(AuthorizationConstants.ScopeClaimType, AuthorizationConstants.UserReadPolicy));
	options.AddPolicy(AuthorizationConstants.UserWritePolicy,
		policy => policy.RequireClaim(AuthorizationConstants.ScopeClaimType, AuthorizationConstants.UserWritePolicy));
});

var app = builder.Build();

// Apply migrations automatically
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    await dbContext.Database.MigrateAsync();
}

// Serve static files (avatars, etc.) from wwwroot
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
