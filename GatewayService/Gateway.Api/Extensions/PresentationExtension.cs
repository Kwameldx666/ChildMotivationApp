using Gateway.Authorization.ScopeRequirement;
using Gateway.Common.Constants.Scopes;
using Gateway.Infrastructure.Handlers;
using Gateway.Middlewares;
using Microsoft.AspNetCore.Authorization;

namespace Gateway.Extensions;

internal static class PresentationExtension
{
    public const string CorsPolicyName = "GatewayCorsPolicy";

    public static void AddPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddHttpContextAccessor();
        services.AddEndpointsApiExplorer();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddPolicies();
        services.AddCorsPolicy(configuration);
    }
    
    private static void AddPolicies(this IServiceCollection services)
    {
        services.AddTransient<AuthorizationForwardingHandler>();
        services.AddScoped<IAuthorizationHandler, ScopeRequirementHandler>();

        services.AddAuthorization(options =>
        {
            foreach (var s in UserScopes.All) 
            {
                options.AddPolicy(s, policy => policy.Requirements.Add(new ScopeRequirement(s)));
            }
        });
    }

    private static void AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, builder =>    
            {
                builder.WithOrigins(allowedOrigins!)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });
    }
}