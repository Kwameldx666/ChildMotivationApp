using Gateway.Common.Constants.Claim;
using Microsoft.AspNetCore.Authorization;

namespace Gateway.Authorization.ScopeRequirement;

public class ScopeRequirementHandler : AuthorizationHandler<ScopeRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, ScopeRequirement requirement)
    {
        var scopes = context.User.FindAll(ClaimConstants.Scope).Select(c => c.Value).ToList();

        if (requirement.Scopes.All(s => scopes.Contains(s))) context.Succeed(requirement);

        return Task.CompletedTask;
    }
}