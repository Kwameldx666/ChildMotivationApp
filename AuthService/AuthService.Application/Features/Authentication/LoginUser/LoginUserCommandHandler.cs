using System.Net;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Dto;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Application.Dto.User;
using AuthService.Common.Constants.Claim;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.LoginUser;

public class LoginUserCommandHandler(
    UserManager<User> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    ITokenProvider tokenProvider)
    : IRequestHandler<LoginUserCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        var correctPassword = user != null && await userManager.CheckPasswordAsync(user, request.Password);
        if (user is null || !correctPassword)
            return Result<LoginResponse>.Failure(HttpStatusCode.Unauthorized,
                AuthorizationErrors.Unauthorized("User credentials are invalid"));

        var roles = await userManager.GetRolesAsync(user);

        var scopeSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var roleName in roles)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role is null) continue;

            var roleClaims = await roleManager.GetClaimsAsync(role);

            foreach (var claim in roleClaims.Where(r => r.Type == ClaimConstants.Scope)) scopeSet.Add(claim.Value);
        }

        var tokenArgs = new UserArgs
        {
            UserId = user.Id.ToString(),
            Email = user.Email!,
            Scopes = scopeSet,
            Roles = roles
        };

        var generateTokenResponse = await tokenProvider.GenerateAccessToken(tokenArgs, cancellationToken);
        var authUser = new AuthUserDto(
            user.Id.ToString(),
            user.Email!,
            user.Name ?? string.Empty,
            user.LastName ?? string.Empty);

        var profile = new UserProfileDto(
            user.Name ?? string.Empty,
            user.LastName ?? string.Empty,
            user.Avatar ?? string.Empty,
            user.UserType.ToString().ToLowerInvariant(),
            user.Age);

        var family = string.IsNullOrWhiteSpace(user.FamilyCode)
            ? null
            : new FamilyDto(user.FamilyCode, null, null);

        var response = new ExternalLoginResponse(generateTokenResponse.AccessToken, generateTokenResponse.RefreshToken,
            authUser, profile, family);

        return Result<LoginResponse>.Success(response);
    }
}