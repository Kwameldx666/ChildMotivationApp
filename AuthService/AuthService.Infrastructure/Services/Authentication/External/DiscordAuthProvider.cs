using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
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

public class DiscordAuthProvider(
    IOptions<DiscordOptions> discordOptions,
    IOptions<DiscordEndpoints> discordEndpoint,
    IHttpClientFactory client,
    ILogger<DiscordAuthProvider> logger) : IExternalAuthProvider
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

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var shortBody = body?.Length > 800 ? body.Substring(0, 800) + "..." : body;
            logger.LogError("Discord token request failed: {Status} {Body}", (int)response.StatusCode, shortBody);
            return Result.Failure<ExternalAuthToken>(HttpStatusCode.BadRequest,
                AuthorizationErrors.ExternalAuthFailed($"Provider returned {(int)response.StatusCode}: {shortBody}"));
        }

        var token = JsonSerializer.Deserialize<GitHubTokenResponse>(body);
        if (token is null || string.IsNullOrEmpty(token.AccessToken))
            return Result.Failure<ExternalAuthToken>(HttpStatusCode.BadRequest,
                AuthorizationErrors.ExternalAuthFailed("The access token is missing"));
        var result = new ExternalAuthToken(token.AccessToken);
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
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            var shortBody = body?.Length > 800 ? body.Substring(0, 800) + "..." : body;
            logger.LogError("Discord userinfo request failed: {Status} {Body}", (int)response.StatusCode, shortBody);
            return Result.Failure<ExternalUserInfo>(
                response.StatusCode,
                AuthorizationErrors.ExternalAuthFailed($"Provider returned {(int)response.StatusCode}: {shortBody}"));
        }

        var userBody = await response.Content.ReadAsStringAsync(cancellationToken);

        ExternalUserInfo? userInfo = null;

        try
        {
            using var doc = JsonDocument.Parse(userBody);
            var root = doc.RootElement;

            var id = root.TryGetProperty("id", out var idProp) && idProp.ValueKind == JsonValueKind.String
                ? idProp.GetString()
                : null;

            var email = root.TryGetProperty("email", out var emailProp) && emailProp.ValueKind == JsonValueKind.String
                ? emailProp.GetString()
                : null;

            var username = root.TryGetProperty("global_name", out var globalNameProp) && globalNameProp.ValueKind == JsonValueKind.String
                ? globalNameProp.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(username) && root.TryGetProperty("username", out var usernameProp) && usernameProp.ValueKind == JsonValueKind.String)
            {
                username = usernameProp.GetString();
            }

            var picture = root.TryGetProperty("avatar", out var avatarProp) && avatarProp.ValueKind == JsonValueKind.String
                ? BuildDiscordAvatarUrl(id, avatarProp.GetString())
                : null;

            userInfo = new ExternalUserInfo
            {
                Email = email ?? string.Empty,
                Name = username ?? string.Empty,
                Picture = picture ?? string.Empty,
                Sub = id ?? string.Empty
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to map Discord userinfo response. Raw body: {Body}", userBody);
        }

        if (userInfo is null)
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Empty user info response"));

        if (string.IsNullOrWhiteSpace(userInfo.Email))
        {
            logger.LogWarning("Discord did not provide an email for the current user. Returning partial user info for pending flow.");
        }

        return Result<ExternalUserInfo>.Success(userInfo);
    }

    private static string? BuildDiscordAvatarUrl(string? userId, string? avatarId)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(avatarId))
            return null;

        var normalizedAvatarId = avatarId.Trim();
        var extension = normalizedAvatarId.StartsWith("a_") ? "gif" : "png";
        return $"https://cdn.discordapp.com/avatars/{userId.Trim()}/{normalizedAvatarId}.{extension}?size=256";
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