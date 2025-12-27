using AuthService.Application.Abstractions;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Abstractions.Persistence;
using AuthService.Application.Dto.Auth.Login;
using AuthService.Application.Dto.User;
using AuthService.Application.Options;
using AuthService.Common.Constants.Claim;
using AuthService.Common.ResultPattern;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Services.Session;

public class ExternalLoginSessionBuilder(
    UserManager<Domain.Entities.User> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    ITokenProvider tokenProvider,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    IOptions<JwtBearerOptions> jwtOptions
) : IExternalLoginSessionBuilder
    
{
    public async Task<Result<ExternalLoginResponse>> CreateAsync(Domain.Entities.User user, CancellationToken cancellationToken = default)
    {
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
        var refreshTokenExpiresOnUtc = DateTime.UtcNow.AddDays(jwtOptions.Value.RefreshTokenLifetime);

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
            user.Age);

        var family = string.IsNullOrWhiteSpace(user.FamilyCode)
            ? null
            : new FamilyDto(user.FamilyCode, user.FamilyName, user.FamilyEmblem);

        var response = new ExternalLoginResponse(
            generateTokenResponse.AccessToken,
            generateTokenResponse.RefreshToken,
            authUser,
            profile,
            family);

        return Result<ExternalLoginResponse>.Success(response);
    }
}