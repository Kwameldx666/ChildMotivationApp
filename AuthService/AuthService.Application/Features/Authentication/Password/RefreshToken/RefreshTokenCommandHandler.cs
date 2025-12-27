using System.Net;
using AuthService.Application.Abstractions.Authentication.Internal;
using AuthService.Application.Abstractions.Persistence;
using AuthService.Application.Claim;
using AuthService.Application.Models.Auth.Login;
using AuthService.Application.Models.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace AuthService.Application.Features.Authentication.RefreshToken;

public class RefreshTokenCommandHandler(
    IRefreshTokenRepository refreshTokenRepository,
    ITokenProvider tokenProvider,
    IUnitOfWork unitOfWork,
    UserManager<Domain.Entities.User> userManager,
    RoleManager<IdentityRole<Guid>> roleManager)
    : IRequestHandler<RefreshTokenCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return Result<LoginResponse>.Failure(HttpStatusCode.BadRequest,
                AuthorizationErrors.Unauthorized("Refresh token is required."));

        var refreshToken = await refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);

        if (refreshToken is null)
            return Result<LoginResponse>.Failure(HttpStatusCode.Unauthorized,
                AuthorizationErrors.Unauthorized("Refresh token is invalid."));

        if (refreshToken.ExpiresOnUtc <= DateTime.UtcNow)
        {
            refreshTokenRepository.Remove(refreshToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<LoginResponse>.Failure(HttpStatusCode.Unauthorized,
                AuthorizationErrors.Unauthorized("Refresh token has expired."));
        }

        var user = refreshToken.User;

        var userArgs = await BuildUserArgsAsync(user);
        var tokenResponse = await tokenProvider.GenerateAccessToken(userArgs, cancellationToken);

        refreshToken.Token = tokenResponse.RefreshToken;
        refreshToken.ExpiresOnUtc = tokenProvider.ProvideRefreshTokenLifetime();

        refreshTokenRepository.Update(refreshToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var response = new LoginResponse(tokenResponse.AccessToken, tokenResponse.RefreshToken);

        return Result<LoginResponse>.Success(response);
    }

    private async Task<UserArgs> BuildUserArgsAsync(Domain.Entities.User user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var scopeSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var roleName in roles)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role is null) continue;

            var roleClaims = await roleManager.GetClaimsAsync(role);
            foreach (var claim in roleClaims.Where(c => c.Type == ClaimConstants.Scope)) scopeSet.Add(claim.Value);
        }

        return new UserArgs
        {
            UserId = user.Id.ToString(),
            Email = user.Email ?? string.Empty,
            Roles = roles,
            Scopes = scopeSet
        };
    }
}