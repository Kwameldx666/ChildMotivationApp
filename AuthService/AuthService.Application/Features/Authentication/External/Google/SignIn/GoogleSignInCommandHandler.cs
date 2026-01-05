using System.IdentityModel.Tokens.Jwt;
using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.External.Google.SignIn;

public class GoogleSignInCommandHandler(
    IExternalAuthProviderFactory googleServiceClientFactory,
    IOAuthSessionStore sessionStore,
    UserManager<Domain.Entities.User> userManager,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthPendingUserStore pendingUserStore,
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

        // 3️⃣ Пользователь уже существует
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