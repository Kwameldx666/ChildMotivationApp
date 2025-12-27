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

public class GitHubSignInCommandHandler(
    IOAuthStateStore stateStore,
    IExternalAuthProviderFactory providerFactory,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthPendingUserStore pendingUserStore,
    IOAuthSessionStore sessionStore,
    UserManager<Domain.Entities.User> userManager,
    Microsoft.Extensions.Logging.ILogger<GitHubSignInCommandHandler> logger)
    : IRequestHandler<GitHubSignInCommand, Result<ExternalSignInResult>>
{
    public async Task<Result<ExternalSignInResult>> Handle(
        GitHubSignInCommand request,
        CancellationToken cancellationToken)
    {
        // Log callback inputs (do not log sensitive tokens)
        logger.LogInformation("GitHub callback received: state={State}, hasCode={HasCode}", request.State, !string.IsNullOrWhiteSpace(request.Code));

        // 1️⃣ Проверка state
        var stateValid =
            await stateStore.ValidateStateAsync(
                request.State,
                cancellationToken);

        if (!stateValid)
        {
            logger.LogWarning("Invalid or expired OAuth state: {State}", request.State);
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(
                    "State parameter is invalid or expired."));
        }

        // Resolve provider explicitly (use GitHub provider)
        var authProvider = providerFactory.GetProvider(AuthService.Application.Enums.ExternalProviderType.GitHub);

        // 2️⃣ Exchange code → access_token
        var tokenResult =
            await authProvider.RequestAccessToken(
                request.Code,
                cancellationToken);

        if (!tokenResult.IsSuccess)
        {
            logger.LogWarning("GitHub token exchange failed: status={Status}, error={Error}", tokenResult.StatusCode, tokenResult.Error?.ErrorDescription);
            return Result.Failure<ExternalSignInResult>(
                tokenResult.StatusCode,
                tokenResult.Error!);
        }

        if (string.IsNullOrWhiteSpace(tokenResult.Value!.AccessToken))
        {
            logger.LogWarning("GitHub token exchange returned empty access token.");
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(
                    "GitHub did not return access token."));
        }

        // 3️⃣ Получение user info
        var userInfoResult =
            await authProvider.RequestUserInfo(
                tokenResult.Value.AccessToken!,
                cancellationToken);

        if (!userInfoResult.IsSuccess)
        {
            logger.LogWarning("GitHub userinfo fetch failed: status={Status}, error={Error}", userInfoResult.StatusCode, userInfoResult.Error?.ErrorDescription);
            return Result.Failure<ExternalSignInResult>(
                userInfoResult.StatusCode,
                userInfoResult.Error!);
        }

        var userInfo = userInfoResult.Value!;

        // 4️⃣ Пользователь уже существует
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
            {
                return Result.Failure<ExternalSignInResult>(
                    sessionResult.StatusCode,
                    sessionResult.Error!);
            }

            var sessionToken =
                await sessionStore.StoreAsync(
                    sessionResult.Value!,
                    cancellationToken);

            return Result<ExternalSignInResult>.Success(
                new ExternalSignInResult(
                    ExternalSignInStatus.Authenticated,
                    sessionToken));
        }

        // 5️⃣ Новый пользователь → Pending
        var pendingToken =
            await pendingUserStore.StoreAsync(
                userInfo,
                cancellationToken);

        return Result<ExternalSignInResult>.Success(
            new ExternalSignInResult(
                ExternalSignInStatus.Pending,
                pendingToken));
    }
}
