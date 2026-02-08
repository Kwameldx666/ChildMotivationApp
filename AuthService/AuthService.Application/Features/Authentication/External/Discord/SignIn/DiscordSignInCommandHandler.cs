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

namespace AuthService.Application.Features.Authentication.External.Discord.SignIn;

public class DiscordSignInCommandHandler(
    IOAuthStateStore stateStore,
    IExternalAuthProviderFactory authProviderFactory,
    IOAuthPendingUserStore pendingUserStore,
    UserManager<Domain.Entities.User> userManager,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthSessionStore sessionStore,
    ILogger<DiscordSignInCommandHandler> logger)
    : IRequestHandler<DiscordSignInCommand, Result<ExternalSignInResult>>
{
    public async Task<Result<ExternalSignInResult>> Handle(DiscordSignInCommand request,
        CancellationToken cancellationToken)
    {
        var authProvider = authProviderFactory.GetProvider(ExternalProviderType.Discord);

        var stateValid = await stateStore.ValidateStateAsync(ExternalProviderType.Discord, request.State, cancellationToken);

        if (!stateValid)
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(
                    "State parameter is invalid or expired."));

        // Try to get access token
        var tokenResult = await authProvider.RequestAccessToken(request.Code, cancellationToken);

        if (!tokenResult.IsSuccess)
            return Result.Failure<ExternalSignInResult>(
                tokenResult.StatusCode,
                tokenResult.Error!);

        if (string.IsNullOrWhiteSpace(tokenResult.Value!.AccessToken))
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(
                    "Discord did not return access token."));

        //Try to request user info

        var userInfoResult = await authProvider.RequestUserInfo(tokenResult.Value.AccessToken, cancellationToken);
        if (!userInfoResult.IsSuccess)
            return Result.Failure<ExternalSignInResult>(
                userInfoResult.StatusCode,
                userInfoResult.Error!);

        var userInfo = userInfoResult.Value!;

        if (string.IsNullOrWhiteSpace(userInfo.Email))
        {
            var missingEmailPendingToken = await pendingUserStore.StoreAsync(userInfo, cancellationToken);
            return Result<ExternalSignInResult>.Success(
                new ExternalSignInResult(ExternalSignInStatus.Pending, missingEmailPendingToken));
        }

        // 4️⃣ User already exists
        var existingUser =
            await userManager.FindByEmailAsync(
                userInfo.Email);

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

        // 5️⃣ Auto-register new user with default settings
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
            logger.LogError("Failed to auto-register user via Discord OAuth: {Error}", error);
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

        logger.LogInformation("Auto-registered new user via Discord OAuth: {Email}", userInfo.Email);

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