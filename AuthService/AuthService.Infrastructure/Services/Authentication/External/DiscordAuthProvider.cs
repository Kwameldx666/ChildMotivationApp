using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.Token;
using AuthService.Application.Dto.User;
using AuthService.Application.Enums;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;
using AuthService.Infrastructure.Constants;
using AuthService.Infrastructure.Options.External;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Services.Authentication.External;

public class DiscordAuthProvider(
    IOptions<DiscordOptions> discordOptions,
    IOptions<DiscordEndpoints> discordEndpoint,
    IHttpClientFactory client) : IExternalAuthProvider
{
    // Keep IOptions<T> references and defer accessing .Value until methods run so the app won't force validation at DI registration time.
    private readonly DiscordEndpoints _discordEndpoints = discordEndpoint.Value;
    private readonly DiscordOptions _discordOptions = discordOptions.Value;
    private readonly HttpClient _client = client.CreateClient(DefaultHttpClientNames.Discord);
    public ExternalProviderType ProviderType => ExternalProviderType.Discord;

 public async Task<Result<ExternalAuthToken>> RequestAccessToken(string code, CancellationToken cancellationToken)
    {
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = _discordOptions.ClientId.Trim(),
            ["client_secret"] = _discordOptions.ClientSecret.Trim(),
            ["redirect_uri"] = _discordOptions.RedirectUri.Trim(),
            ["grant_type"] = "authorization_code"
        });

        var request = new HttpRequestMessage(HttpMethod.Post, _discordEndpoints.DiscordToken)
        {
            Content = content
        };

        var response = await _client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
            return Result.Failure<ExternalAuthToken>(HttpStatusCode.BadRequest,
                AuthorizationErrors.ExternalAuthFailed());

        var token = await response.Content.ReadFromJsonAsync<ExternalAuthToken>(cancellationToken);

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
            _discordEndpoints.DiscordUserInfo);

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
            return Result.Failure<ExternalUserInfo>(
                response.StatusCode,
                AuthorizationErrors.ExternalAuthFailed());

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
            ["client_id"] = _discordOptions.ClientId,
            ["redirect_uri"] = _discordOptions.RedirectUri,
            ["response_type"] = "code",
            ["response_mode"] = "query",
            ["scope"] = string.Join(' ', scopes),
            ["state"] = state
        };

        var authorizationUrl = QueryHelpers.AddQueryString(_discordEndpoints.DiscordAuthorize, query);

        var response = new AuthorizationUrlResponse(authorizationUrl, state);
        return response;
    }
}