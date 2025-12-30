using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.Token;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Infrastructure.Common;
using AuthService.Infrastructure.Constants;
using AuthService.Infrastructure.Options.External;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace AuthService.Infrastructure.Services.Authentication.External;

public class GoogleAuthProvider(
    IOptions<GoogleEndpoints> googleEndpoints,
    IOptions<GoogleOptions> googleOptions,
    IHttpClientFactory clientFactory,
    ILogger<GoogleAuthProvider> logger) :
    IExternalAuthProvider
{
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.Google);
    private readonly GoogleEndpoints _googleEndpoints = googleEndpoints.Value;
    private readonly GoogleOptions _googleOptions = googleOptions.Value;
    private readonly ILogger<GoogleAuthProvider> _logger = logger;
    public ExternalProviderType ProviderType => ExternalProviderType.Google;
    
    public async Task<Result<ExternalAuthToken>> RequestAccessToken(string code, CancellationToken cancellationToken)
    {
        // Per Google OAuth spec, send client_id and client_secret in the request body as x-www-form-urlencoded
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _googleOptions.ClientId.Trim(),
            ["client_secret"] = _googleOptions.ClientSecret.Trim(),
            ["redirect_uri"] = _googleOptions.RedirectUri.Trim(),
            ["grant_type"] = "authorization_code"
        });

        var request = new HttpRequestMessage(HttpMethod.Post, _googleEndpoints.GoogleToken)
        {
            Content = content
        };

        var response = await _client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            var shortBody = body?.Length > 800 ? body.Substring(0, 800) + "..." : body;
            _logger.LogError("Google token request failed: {Status} {Body}", (int)response.StatusCode, shortBody);
            return Result.Failure<ExternalAuthToken>(HttpStatusCode.BadRequest,
                AuthorizationErrors.ExternalAuthFailed($"Provider returned {(int)response.StatusCode}: {shortBody}"));
        }

        var token = await response.Content.ReadFromJsonAsync<GoogleTokenResponse>(cancellationToken);

        if (token is null || string.IsNullOrEmpty(token.AccessToken))
            return Result.Failure<ExternalAuthToken>(HttpStatusCode.BadRequest,
                AuthorizationErrors.ExternalAuthFailed("The access token is missing"));
        var result = new ExternalAuthToken(token.AccessToken, token.IdToken);
        return Result<ExternalAuthToken>.Success(result);
    }

    public async Task<Result<ExternalUserInfo>> RequestUserInfo(
        string accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Access token is empty"));

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            _googleEndpoints.GoogleUserInfo);

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;

        try
        {
            response = await _client.SendAsync(request, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.ServiceUnavailable,
                AuthorizationErrors.ExternalProviderUnavailable());
        }

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            var shortBody = body?.Length > 800 ? body.Substring(0, 800) + "..." : body;
            _logger.LogError("Google userinfo request failed: {Status} {Body}", (int)response.StatusCode, shortBody);
            return Result.Failure<ExternalUserInfo>(
                response.StatusCode,
                AuthorizationErrors.ExternalAuthFailed($"Provider returned {(int)response.StatusCode}: {shortBody}"));
        }

        var userInfo = await response.Content
            .ReadFromJsonAsync<ExternalUserInfo>(cancellationToken);

        if (userInfo is null)
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Empty user info response"));

        if (string.IsNullOrWhiteSpace(userInfo.Email))
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Email was not provided by external provider"));

        return Result<ExternalUserInfo>.Success(userInfo);
    }


    public AuthorizationUrlResponse BuildAuthQuery(string state, string[] scopes)
    {
        var query = new Dictionary<string, string?>
        {
            ["client_id"] = _googleOptions.ClientId,
            ["redirect_uri"] = _googleOptions.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = string.Join(' ', scopes),
            ["access_type"] = "offline",
            ["prompt"] = "consent",
            ["state"] = state
        };

        var authorizationUrl = QueryHelpers.AddQueryString(googleEndpoints.Value.GoogleAuthorize, query);

        var response = new AuthorizationUrlResponse(authorizationUrl, state);
        return response;
    }
}