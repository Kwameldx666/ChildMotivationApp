using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
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
        logger.LogInformation(
            "GitHub callback received: state={State}, hasCode={HasCode}",
            request.State,
            !string.IsNullOrWhiteSpace(request.Code));

        // 1️⃣ Validate state
        if (!await stateStore.ValidateStateAsync(ExternalProviderType.GitHub, request.State, cancellationToken))
        {
            logger.LogWarning("Invalid OAuth state: {State}", request.State);

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

        // 5️⃣ Missing email → pending
        if (string.IsNullOrWhiteSpace(userInfo.Email))
        {
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
            var sessionResult = await externalLoginSessionBuilder.CreateAsync(
                existingUser,
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

        // 7️⃣ New user → pending
        var newPendingToken = await pendingUserStore.StoreAsync(
            userInfo,
            cancellationToken);

        return Result<ExternalSignInResult>.Success(
            new ExternalSignInResult(
                ExternalSignInStatus.Pending,
                newPendingToken));
    }
}
