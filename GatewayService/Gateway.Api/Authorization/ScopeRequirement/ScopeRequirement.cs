using Microsoft.AspNetCore.Authorization;

namespace Gateway.Authorization.ScopeRequirement;

public class ScopeRequirement(params string[] scopes) : IAuthorizationRequirement
{
    public string[] Scopes { get; } = scopes;
}