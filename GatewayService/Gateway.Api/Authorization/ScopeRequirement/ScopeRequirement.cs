using Microsoft.AspNetCore.Authorization;

namespace AuthService.Authorization.ScopeRequirement;

public class ScopeRequirement(params string[] scopes) : IAuthorizationRequirement
{
    public string[] Scopes { get; } = scopes;
}