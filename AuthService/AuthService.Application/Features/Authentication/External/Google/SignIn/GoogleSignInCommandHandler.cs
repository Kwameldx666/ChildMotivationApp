using System.IdentityModel.Tokens.Jwt;
using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Application.User;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.External.Google.SignIn;

public class GoogleSignInCommandHandler(
    IExternalAuthProviderFactory googleServiceClientFactory,
    IOAuthSessionStore sessionStore,
    UserManager<Domain.Entities.User> userManager,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthStateStore stateStore,
    ILogger<GoogleSignInCommandHandler> logger)
    : IRequestHandler<GoogleSignInCommand, Result<ExternalSignInResult>>
{
    public async Task<Result<ExternalSignInResult>> Handle(
        GoogleSignInCommand request,
        CancellationToken cancellationToken)
    {
        var googleServiceClient = googleServiceClientFactory.GetProvider(ExternalProviderType.Google);
        var stateValid = await stateStore.ValidateStateAsync(ExternalProviderType.Google, request.State, cancellationToken);

        if (!stateValid)
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("State parameter is invalid or expired."));

        var tokenResult =
            await googleServiceClient.RequestAccessToken(
                request.Code,
                cancellationToken);

        if (!tokenResult.IsSuccess)
            return Result.Failure<ExternalSignInResult>(
                tokenResult.StatusCode,
                tokenResult.Error!);

        ExternalUserInfo userInfo;

        if (!string.IsNullOrWhiteSpace(tokenResult.Value!.AccessToken))
        {
            var userInfoResult =
                await googleServiceClient.RequestUserInfo(
                    tokenResult.Value.AccessToken,
                    cancellationToken);

            if (!userInfoResult.IsSuccess)
            {
                logger.LogWarning(
                    "Failed to fetch Google user info: {Error}",
                    userInfoResult.Error?.ErrorDescription);

                return Result.Failure<ExternalSignInResult>(
                    userInfoResult.StatusCode,
                    userInfoResult.Error!);
            }

            userInfo = userInfoResult.Value!;
        }
        // 2️⃣ Fallback — id_token
        else if (!string.IsNullOrWhiteSpace(tokenResult.Value.IdToken))
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(tokenResult.Value.IdToken);

                userInfo = new ExternalUserInfo
                {
                    Email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? string.Empty,
                    Name = jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? string.Empty,
                    Picture = jwt.Claims.FirstOrDefault(c => c.Type == "picture")?.Value ?? string.Empty,
                    Sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value ?? string.Empty
                };
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Failed to decode Google id_token");

                return Result.Failure<ExternalSignInResult>(
                    HttpStatusCode.BadRequest,
                    DefaultErrors.BadRequest(
                        "Failed to obtain user info from Google id_token."));
            }
        }
        else
        {
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(
                    "Google did not return access_token or id_token."));
        }

        // 3️⃣ User already exists
        var existingUser =
            await userManager.FindByEmailAsync(userInfo.Email);

        if (existingUser is not null)
        {
            var sessionResult =
                await externalLoginSessionBuilder.CreateAsync(
                    existingUser,
                    cancellationToken);

            if (!sessionResult.IsSuccess)
                return Result.Failure<ExternalSignInResult>(
                    sessionResult.StatusCode,
                    sessionResult.Error!);

            var sessionToken =
                await sessionStore.StoreAsync(
                    sessionResult.Value!,
                    cancellationToken);

            return Result<ExternalSignInResult>.Success(
                new ExternalSignInResult(
                    ExternalSignInStatus.Authenticated,
                    sessionToken));
        }

        // 4️⃣ Auto-register new user with default settings
        return await AutoRegisterUserAsync(userInfo, cancellationToken);
    }

    private async Task<Result<ExternalSignInResult>> AutoRegisterUserAsync(
        ExternalUserInfo userInfo,
        CancellationToken cancellationToken)
    {
        // Split name from OAuth provider
        var (firstName, lastName) = SplitName(userInfo.Name);

        // Resolve family context for Parent role (auto-generate family code)
        var (familyCode, familyName, familyEmblem, familyError) = await FamilyContextResolver.ResolveAsync(
            userManager,
            UserType.Parent,
            null, // No custom code
            null, // No custom family name
            null, // No custom emblem
            cancellationToken);

        if (familyError is not null)
            return Result.Failure<ExternalSignInResult>(
                (HttpStatusCode)familyError.StatusCode,
                familyError.Error!);

        // Create new user with default settings
        var newUser = new Domain.Entities.User
        {
            Email = userInfo.Email,
            UserName = userInfo.Email,
            EmailConfirmed = true, // OAuth providers validate email
            FamilyCode = familyCode,
            FamilyName = familyName,
            FamilyEmblem = familyEmblem,
            UserStatus = UserStatuses.Active,
            Avatar = userInfo.Picture,
            Age = null, // Not required for Parent
            UserType = UserType.Parent, // Default role
            Name = firstName,
            LastName = lastName
        };

        var createResult = await userManager.CreateAsync(newUser);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            logger.LogError("Failed to auto-register user via Google OAuth: {Error}", error);
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest($"Failed to create user: {error}"));
        }

        // Add user to Parent role
        var addToRoleResult = await userManager.AddToRoleAsync(newUser, UserType.Parent.ToString());
        if (!addToRoleResult.Succeeded)
        {
            await userManager.DeleteAsync(newUser); // Rollback
            var error = string.Join("; ", addToRoleResult.Errors.Select(e => e.Description));
            logger.LogError("Failed to assign Parent role to new user: {Error}", error);
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest($"Failed to assign role: {error}"));
        }

        logger.LogInformation("Auto-registered new user via Google OAuth: {Email}", userInfo.Email);

        // Create session for new user
        var sessionResult = await externalLoginSessionBuilder.CreateAsync(
            newUser,
            cancellationToken);

        if (!sessionResult.IsSuccess)
            return Result.Failure<ExternalSignInResult>(
                sessionResult.StatusCode,
                sessionResult.Error!);

        var sessionToken = await sessionStore.StoreAsync(
            sessionResult.Value!,
            cancellationToken);

        return Result<ExternalSignInResult>.Success(
            new ExternalSignInResult(
                ExternalSignInStatus.Authenticated,
                sessionToken));
    }

    private static (string firstName, string lastName) SplitName(string source)
    {
        if (string.IsNullOrWhiteSpace(source)) return ("User", "User");

        var parts = source.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return (source.Trim(), source.Trim());

        if (parts.Length == 1)
        {
            var value = parts[0].Trim();
            return (value, value);
        }

        return (parts[0].Trim(), parts[1].Trim());
    }
}