using System.IdentityModel.Tokens.Jwt;
using System.Net;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Features.Authentication.External.ExternalSignIn;

public class ExternalSignInHandler
{
    private readonly IExternalAuthProviderFactory _providerFactory;
    private readonly IOAuthStateStore _stateStore;
    private readonly UserManager<Domain.Entities.User> _userManager;
    private readonly IExternalLoginSessionBuilder _externalLoginSessionBuilder;
    private readonly IOAuthPendingUserStore _pendingUserStore;
    private readonly IOAuthSessionStore _sessionStore;
    private readonly ILogger<ExternalSignInHandler> _logger;

    public ExternalSignInHandler(
        IExternalAuthProviderFactory providerFactory,
        IOAuthStateStore stateStore,
        UserManager<Domain.Entities.User> userManager,
        IExternalLoginSessionBuilder externalLoginSessionBuilder,
        IOAuthPendingUserStore pendingUserStore,
        IOAuthSessionStore sessionStore,
        ILogger<ExternalSignInHandler> logger)
    {
        _providerFactory = providerFactory;
        _stateStore = stateStore;
        _userManager = userManager;
        _externalLoginSessionBuilder = externalLoginSessionBuilder;
        _pendingUserStore = pendingUserStore;
        _sessionStore = sessionStore;
        _logger = logger;
    }

    public async Task<Result<ExternalSignInResult>> Handle(
        ExternalProviderType providerType,
        string code,
        string state,
        CancellationToken cancellationToken)
    {
        // Validate state
        var stateValid = await _stateStore.ValidateStateAsync(state, cancellationToken);

        if (!stateValid)
        {
            return Result.Failure<ExternalSignInResult>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("State parameter is invalid or expired."));
        }

        var provider = _providerFactory.GetProvider(providerType);

        // Exchange code -> token
        var tokenResult = await provider.RequestAccessToken(code, cancellationToken);

        if (!tokenResult.IsSuccess)
            return Result.Failure<ExternalSignInResult>(tokenResult.StatusCode, tokenResult.Error!);

        ExternalUserInfo userInfo;

        // Prefer access_token
        if (!string.IsNullOrWhiteSpace(tokenResult.Value!.AccessToken))
        {
            var userInfoResult = await provider.RequestUserInfo(tokenResult.Value.AccessToken!, cancellationToken);

            if (!userInfoResult.IsSuccess)
            {
                _logger.LogWarning("Failed to fetch user info from provider {Provider}: {Error}", providerType, userInfoResult.Error?.ErrorDescription);
                return Result.Failure<ExternalSignInResult>(userInfoResult.StatusCode, userInfoResult.Error!);
            }

            userInfo = userInfoResult.Value!;
        }
        // Fallback — id_token (used by Google)
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
                _logger.LogError(ex, "Failed to decode id_token from provider {Provider}", providerType);
                return Result.Failure<ExternalSignInResult>(HttpStatusCode.BadRequest, DefaultErrors.BadRequest("Failed to obtain user info from id_token."));
            }
        }
        else
        {
            return Result.Failure<ExternalSignInResult>(HttpStatusCode.BadRequest, DefaultErrors.BadRequest("Provider did not return access_token or id_token."));
        }

        // Existing user?
        var existingUser = await _userManager.FindByEmailAsync(userInfo.Email);

        if (existingUser is not null)
        {
            var sessionResult = await _externalLoginSessionBuilder.CreateAsync(existingUser, cancellationToken);

            if (!sessionResult.IsSuccess)
                return Result.Failure<ExternalSignInResult>(sessionResult.StatusCode, sessionResult.Error!);

            var sessionToken = await _sessionStore.StoreAsync(sessionResult.Value!, cancellationToken);

            return Result<ExternalSignInResult>.Success(new ExternalSignInResult(ExternalSignInStatus.Authenticated, sessionToken));
        }

        // New user -> pending
        var pendingToken = await _pendingUserStore.StoreAsync(userInfo, cancellationToken);

        return Result<ExternalSignInResult>.Success(new ExternalSignInResult(ExternalSignInStatus.Pending, pendingToken));
    }
}
