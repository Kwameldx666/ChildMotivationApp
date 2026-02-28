using System.Net;
using AuthService.Application.Abstractions.Authentication.Internal;
using AuthService.Application.Abstractions.Persistence;
using AuthService.Application.Claim;
using AuthService.Application.Dto.User;
using AuthService.Application.Models.Auth.Login;
using AuthService.Application.Models.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.Password.Login;

public class LoginUserCommandHandler(
    UserManager<Domain.Entities.User> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    ITokenProvider tokenProvider,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<LoginUserCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        var correctPassword = user != null && await userManager.CheckPasswordAsync(user, request.Password);
        if (user is null || !correctPassword)
            return Result<LoginResponse>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("User credentials are invalid"));

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

        var refreshTokenExpiresOnUtc = tokenProvider.ProvideAccessTokenLifetime();

        var refreshToken = await refreshTokenRepository.GetByUserIdAsync(user.Id, cancellationToken);

        if (refreshToken is null)
        {
            refreshToken = new Domain.Entities.RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = generateTokenResponse.RefreshToken,
                ExpiresOnUtc = refreshTokenExpiresOnUtc
            };

            await refreshTokenRepository.AddAsync(refreshToken, cancellationToken);
        }
        else
        {
            refreshToken.Token = generateTokenResponse.RefreshToken;
            refreshToken.ExpiresOnUtc = refreshTokenExpiresOnUtc;
            refreshTokenRepository.Update(refreshToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

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
            user.UserType == UserType.Child ? user.Age : null);

        var family = string.IsNullOrWhiteSpace(user.FamilyCode)
            ? null
            : new FamilyDto(user.FamilyCode, user.FamilyName, user.FamilyEmblem);

        var response = new ExternalLoginResponse(
            generateTokenResponse.AccessToken,
            generateTokenResponse.RefreshToken,
            authUser,
            profile,
            family);

        return Result<LoginResponse>.Success(response);
    }
}