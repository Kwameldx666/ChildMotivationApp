using System.IdentityModel.Tokens.Jwt;
using System.Net;
using AuthService.Application.Abstractions.Infrastructure;
using AuthService.Application.Abstractions.Infrastructure.Clients;
using AuthService.Application.Abstractions.Infrastructure.Session;
using AuthService.Application.Dto.Auth.SignIn;
using AuthService.Application.Dto.User;
using AuthService.Application.Extensions;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.SignIn.GoogleSignIn;

public class GoogleSignInCommandHandler(
    IGoogleServiceClient googleServiceClient,
    IGoogleStateStore stateStore,
    UserManager<User> userManager,
    IExternalLoginSessionBuilder externalLoginSessionBuilder,
    IOAuthPendingUserStore pendingUserStore,
    IOAuthSessionStore sessionStore,
    ILogger<GoogleSignInCommandHandler> logger)
    : IRequestHandler<GoogleSignInCommand, Result<GoogleSignInResult>>
{
    public async Task<Result<GoogleSignInResult>> Handle(GoogleSignInCommand request,
        CancellationToken cancellationToken)
    {
        var stateValid = await stateStore.ValidateStateAsync(request.State, cancellationToken);
        if (!stateValid)
            return Result<GoogleSignInResult>.Failure(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("State parameter is invalid or expired."));

        var tokenHttpResponse = await googleServiceClient.RequestAccessToken(request.Code, cancellationToken);
        var tokenRawBody = await tokenHttpResponse.Content.ReadAsStringAsync(cancellationToken);
        var tokenResponse = await tokenHttpResponse.EnsureSuccessAndReadJsonAsync<GoogleTokenResponse>();

        if (!tokenResponse.IsSuccess)
        {
            // Log the raw token endpoint response for diagnostics (do NOT share client secrets publicly)
            logger.LogWarning("Google token endpoint failed: Status={Status}, Body={Body}",
                tokenHttpResponse.StatusCode, tokenRawBody);
            return Result.Failure<GoogleSignInResult>(tokenResponse.StatusCode, tokenResponse.Error!);
        }

        // If Google returned an error inside a 200 response, surface it (common: invalid_grant / Code was already redeemed)
        if (!string.IsNullOrWhiteSpace(tokenResponse.Value?.Error))
        {
            logger.LogWarning("Google token endpoint returned OAuth error: {Error} - {Description}. Raw: {Body}",
                tokenResponse.Value.Error, tokenResponse.Value.ErrorDescription, tokenRawBody);

            return Result.Failure<GoogleSignInResult>(HttpStatusCode.Unauthorized,
                AuthorizationErrors.Unauthorized(
                    $"Google OAuth error: {tokenResponse.Value.Error} - {tokenResponse.Value.ErrorDescription}"));
        }

        // Log token response metadata (don't log tokens themselves)
        logger.LogInformation(
            "Google token response: HasAccessToken={HasAccessToken}, HasIdToken={HasIdToken}, TokenType={TokenType}, ExpiresIn={ExpiresIn}",
            !string.IsNullOrWhiteSpace(tokenResponse.Value?.AccessToken),
            !string.IsNullOrWhiteSpace(tokenResponse.Value?.IdToken),
            tokenResponse.Value?.TokenType,
            tokenResponse.Value?.ExpiresIn);

        GoogleUserInfo userInfo;

        if (!string.IsNullOrWhiteSpace(tokenResponse.Value?.AccessToken))
        {
            var userInfoHttpResponse =
                await googleServiceClient.RequestUserInfo(tokenResponse.Value!.AccessToken, cancellationToken);

            if (!userInfoHttpResponse.IsSuccessStatusCode)
            {
                var body = await userInfoHttpResponse.Content.ReadAsStringAsync(cancellationToken);
                logger.LogWarning("Google userinfo request failed: Status={Status}, Body={Body}",
                    userInfoHttpResponse.StatusCode, body);
            }

            var userInfoResponse = await userInfoHttpResponse.EnsureSuccessAndReadJsonAsync<GoogleUserInfo>();

            if (!userInfoResponse.IsSuccess)
                return Result.Failure<GoogleSignInResult>(userInfoResponse.StatusCode, userInfoResponse.Error!);

            userInfo = userInfoResponse.Value!;
        }
        else if (!string.IsNullOrWhiteSpace(tokenResponse.Value?.IdToken))
        {
            // Fallback: decode id_token to extract user info
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(tokenResponse.Value!.IdToken);
                var email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? string.Empty;
                var name = jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? string.Empty;
                var picture = jwt.Claims.FirstOrDefault(c => c.Type == "picture")?.Value ?? string.Empty;
                var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value ?? string.Empty;

                userInfo = new GoogleUserInfo
                {
                    Email = email,
                    Name = name,
                    Picture = picture,
                    Sub = sub
                };

                logger.LogInformation("Extracted user info from id_token: EmailSet={HasEmail}, NameSet={HasName}",
                    !string.IsNullOrWhiteSpace(email), !string.IsNullOrWhiteSpace(name));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to decode id_token from Google token response.");
                return Result.Failure<GoogleSignInResult>(HttpStatusCode.BadRequest,
                    DefaultErrors.BadRequest("Failed to obtain userinfo from Google token response."));
            }
        }
        else
        {
            return Result.Failure<GoogleSignInResult>(HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("No access token or id token was returned by Google."));
        }

        var existingUser = await userManager.FindByEmailAsync(userInfo.Email);

        if (existingUser is not null)
        {
            var sessionResult = await externalLoginSessionBuilder.CreateAsync(
                existingUser,
                cancellationToken);

            if (!sessionResult.IsSuccess)
                return Result.Failure<GoogleSignInResult>(sessionResult.StatusCode, sessionResult.Error!);

            var sessionToken = await sessionStore.StoreAsync(sessionResult.Value!, cancellationToken);
            var result = new GoogleSignInResult(GoogleSignInStatus.Authenticated, sessionToken);
            return Result<GoogleSignInResult>.Success(result);
        }

        var pendingUser = new GooglePendingUser
        {
            Email = userInfo.Email,
            Name = userInfo.Name,
            Picture = userInfo.Picture,
            Subject = userInfo.Sub
        };

        var pendingToken = await pendingUserStore.StoreAsync(pendingUser, cancellationToken);
        var pendingResult = new GoogleSignInResult(GoogleSignInStatus.Pending, pendingToken);
        return Result<GoogleSignInResult>.Success(pendingResult);
    }
}