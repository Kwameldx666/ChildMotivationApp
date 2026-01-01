using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Features.Authentication.External.Discord.SignIn;

public class DiscordSignInCommandHandler(
    IOAuthStateStore stateStore,
    IExternalAuthProviderFactory authProviderFactory,
    IOAuthPendingUserStore pendingUserStore,
    UserManager<Domain.Entities.User> userManager,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthSessionStore sessionStore)
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