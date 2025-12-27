using System.IdentityModel.Tokens.Jwt;
using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Application.Extensions;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.External.Google.SignIn;

public class GoogleSignInCommandHandler(
    IExternalAuthProvider googleServiceClient,
    IOAuthStateStore stateStore,
    UserManager<Domain.Entities.User> userManager,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthPendingUserStore pendingUserStore,
    IOAuthSessionStore sessionStore,
    ILogger<GoogleSignInCommandHandler> logger)
    : IRequestHandler<GoogleSignInCommand, Result<ExternalSignInResult>>
{
    public async Task<Result<ExternalSignInResult>> Handle(GoogleSignInCommand request,
        CancellationToken cancellationToken)
    {
        var stateValid = await stateStore.ValidateStateAsync(request.State, cancellationToken);
        if (!stateValid)
            return Result<ExternalSignInResult>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("State parameter is invalid or expired."));

        var tokenHttpResponse = await googleServiceClient.RequestAccessToken(request.Code, cancellationToken);
        var tokenRawBody = await tokenHttpResponse.Content.ReadAsStringAsync(cancellationToken);
        var googleToken = await tokenHttpResponse.EnsureSuccessAndReadJsonAsync<GoogleTokenResponse>();

        if (!googleToken.IsSuccess)
        {
            logger.LogWarning("Google token endpoint failed: Status={Status}, Body={Body}",
                tokenHttpResponse.StatusCode, tokenRawBody);

            return Result.Failure<ExternalSignInResult>(googleToken.StatusCode, googleToken.Error!);
        }

        if (!string.IsNullOrWhiteSpace(googleToken.Value?.Error))
        {
            logger.LogWarning("Google OAuth error: {Error} - {Description}. Raw: {Body}",
                googleToken.Value.Error, googleToken.Value.ErrorDescription, tokenRawBody);

            return Result.Failure<ExternalSignInResult>(HttpStatusCode.Unauthorized,
                AuthorizationErrors.Unauthorized(
                    $"Google OAuth error: {googleToken.Value.Error} - {googleToken.Value.ErrorDescription}"));
        }

        ExternalUserInfo userInfo;

        if (!string.IsNullOrWhiteSpace(googleToken.Value?.AccessToken))
        {
            var userInfoHttpResponse =
                await googleServiceClient.RequestUserInfo(googleToken.Value!.AccessToken, cancellationToken);

            if (!userInfoHttpResponse.IsSuccessStatusCode)
            {
                var body = await userInfoHttpResponse.Content.ReadAsStringAsync(cancellationToken);
                logger.LogWarning("Google userinfo request failed: Status={Status}, Body={Body}",
                    userInfoHttpResponse.StatusCode, body);
            }

            var userInfoResponse = await userInfoHttpResponse.EnsureSuccessAndReadJsonAsync<ExternalUserInfo>();
            if (!userInfoResponse.IsSuccess)
                return Result.Failure<ExternalSignInResult>(userInfoResponse.StatusCode, userInfoResponse.Error!);

            userInfo = userInfoResponse.Value!;
        }
        else if (!string.IsNullOrWhiteSpace(googleToken.Value?.IdToken))
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(googleToken.Value.IdToken);

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
                logger.LogError(ex, "Failed to decode id_token from Google token response.");
                return Result.Failure<ExternalSignInResult>(HttpStatusCode.BadRequest,
                    DefaultErrors.BadRequest("Failed to obtain userinfo from Google token response."));
            }
        }
        else
        {
            return Result.Failure<ExternalSignInResult>(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("No access token or id token was returned by Google."));
        }

        var existingUser = await userManager.FindByEmailAsync(userInfo.Email);
        if (existingUser is not null)
        {
            var sessionResult = await externalLoginSessionBuilder.CreateAsync(existingUser, cancellationToken);
            if (!sessionResult.IsSuccess)
                return Result.Failure<ExternalSignInResult>(sessionResult.StatusCode, sessionResult.Error!);

            var sessionToken = await sessionStore.StoreAsync(sessionResult.Value!, cancellationToken);
            var result = new ExternalSignInResult(ExternalSignInStatus.Authenticated, sessionToken);
            return Result<ExternalSignInResult>.Success(result);
        }

        var pendingUser = new ExternalUserInfo
        {
            Email = userInfo.Email,
            Name = userInfo.Name,
            Picture = userInfo.Picture,
            Sub = userInfo.Sub
        };

        var pendingToken = await pendingUserStore.StoreAsync(pendingUser, cancellationToken);
        var pendingResult = new ExternalSignInResult(ExternalSignInStatus.Pending, pendingToken);

        return Result<ExternalSignInResult>.Success(pendingResult);
    }
}