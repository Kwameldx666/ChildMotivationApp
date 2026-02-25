using System.Linq;
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

namespace AuthService.Application.Features.Authentication.External.GitHub.SignIn;

public sealed class GitHubSignInCommandHandler(
    IOAuthStateStore stateStore,
    IExternalAuthProviderFactory providerFactory,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthPendingUserStore pendingUserStore,
    IOAuthSessionStore sessionStore,
    UserManager<Domain.Entities.User> userManager,
    ILogger<GitHubSignInCommandHandler> logger)
    : IRequestHandler<GitHubSignInCommand, Result<ExternalSignInResult>>
{
    public async Task<Result<ExternalSignInResult>> Handle(
        GitHubSignInCommand request,
        CancellationToken cancellationToken)
    {
        // Validate state
        if (!await stateStore.ValidateStateAsync(ExternalProviderType.GitHub, request.State, cancellationToken))
        {

            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("State parameter is invalid or expired."));
        }

        // 2️⃣ Provider
        var authProvider = providerFactory.GetProvider(ExternalProviderType.GitHub);

        // 3️⃣ Token exchange
        var tokenResult = await authProvider.RequestAccessToken(
            request.Code,
            cancellationToken);

        if (!tokenResult.IsSuccess)
        {
            return Result.Failure<ExternalSignInResult>(
                tokenResult.StatusCode,
                tokenResult.Error!);
        }

        var accessToken = tokenResult.Value?.AccessToken;

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("GitHub did not return access token."));
        }

        // 4️⃣ User info
        var userInfoResult = await authProvider.RequestUserInfo(
            accessToken,
            cancellationToken);

        if (!userInfoResult.IsSuccess)
        {
            return Result.Failure<ExternalSignInResult>(
                userInfoResult.StatusCode,
                userInfoResult.Error!);
        }

        var userInfo = userInfoResult.Value!;
        var providerKey = userInfo.Sub?.Trim();
        var providerName = ExternalProviderType.GitHub.ToString();

        // GitHub specific: generate email fallback if not provided
        if (string.IsNullOrWhiteSpace(userInfo.Email) && !string.IsNullOrWhiteSpace(providerKey))
        {
            // Use GitHub ID as email fallback to avoid pending state
            userInfo.Email = $"github-{providerKey}@github.local";
            logger.LogInformation("GitHub user info did not include email, generated fallback: {Email}", userInfo.Email);
        }

        if (!string.IsNullOrWhiteSpace(providerKey))
        {
            var linkedUser = await userManager.FindByLoginAsync(providerName, providerKey);
            if (linkedUser is not null)
            {
                return await IssueSessionAsync(linkedUser);
            }
        }

        // Missing email → auto-register with generated email
        if (string.IsNullOrWhiteSpace(userInfo.Email))
        {
            logger.LogWarning("GitHub user has no email and no provider key for fallback. Creating pending state.");
            var pendingToken = await pendingUserStore.StoreAsync(
                userInfo,
                cancellationToken);

            return Result<ExternalSignInResult>.Success(
                new ExternalSignInResult(
                    ExternalSignInStatus.Pending,
                    pendingToken));
        }

        // 6️⃣ Existing user
        var existingUser = await userManager.FindByEmailAsync(userInfo.Email);

        if (existingUser is not null)
        {
            await EnsureExternalLoginAsync(existingUser);
            return await IssueSessionAsync(existingUser);
        }

        // 7️⃣ Auto-register new user with default settings
        return await AutoRegisterUserAsync(userInfo, providerName, providerKey, cancellationToken);

        async Task EnsureExternalLoginAsync(Domain.Entities.User targetUser)
        {
            if (string.IsNullOrWhiteSpace(providerKey))
            {
                return;
            }

            var currentLogins = await userManager.GetLoginsAsync(targetUser);
            if (currentLogins.Any(login => login.LoginProvider == providerName && login.ProviderKey == providerKey))
            {
                return;
            }

            var addLoginResult = await userManager.AddLoginAsync(
                targetUser,
                new UserLoginInfo(providerName, providerKey, providerName));

            if (!addLoginResult.Succeeded)
            {
                var error = string.Join(
                    "; ",
                    addLoginResult.Errors.Select(e => e.Description));
                logger.LogWarning(
                    "Failed to attach GitHub login for user {UserId}: {Errors}",
                    targetUser.Id,
                    error);
            }
        }

        async Task<Result<ExternalSignInResult>> IssueSessionAsync(Domain.Entities.User targetUser)
        {
            var sessionResult = await externalLoginSessionBuilder.CreateAsync(
                targetUser,
                cancellationToken);

            if (!sessionResult.IsSuccess)
            {
                return Result.Failure<ExternalSignInResult>(
                    sessionResult.StatusCode,
                    sessionResult.Error!);
            }

            var sessionToken = await sessionStore.StoreAsync(
                sessionResult.Value!,
                cancellationToken);

            return Result<ExternalSignInResult>.Success(
                new ExternalSignInResult(
                    ExternalSignInStatus.Authenticated,
                    sessionToken));
        }
    }

    private async Task<Result<ExternalSignInResult>> AutoRegisterUserAsync(
        ExternalUserInfo userInfo,
        string providerName,
        string? providerKey,
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
            logger.LogError("Failed to auto-register user via GitHub OAuth: {Error}", error);
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

        // Add external login if providerKey is available
        if (!string.IsNullOrWhiteSpace(providerKey))
        {
            var addLoginResult = await userManager.AddLoginAsync(
                newUser,
                new UserLoginInfo(providerName, providerKey, providerName));

            if (!addLoginResult.Succeeded)
            {
                var error = string.Join("; ", addLoginResult.Errors.Select(e => e.Description));
                logger.LogWarning(
                    "Failed to attach GitHub login for new user {UserId}: {Errors}",
                    newUser.Id,
                    error);
            }
        }

        logger.LogInformation("Auto-registered new user via GitHub OAuth: {Email}", userInfo.Email);

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
