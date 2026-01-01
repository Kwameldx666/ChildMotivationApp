using System.Globalization;
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
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Services.Authentication.External;

public class GitHubAuthProvider(
    IOptions<GitHubOptions> gitHubOptions,
    IOptions<GitHubEndpoints> gitHubEndpoints,
    IHttpClientFactory httpClientFactory,
    ILogger<GitHubAuthProvider> logger)
    : IExternalAuthProvider
{
    private readonly HttpClient _client =
        httpClientFactory.CreateClient(DefaultHttpClientNames.GitHub);

    private readonly ILogger<GitHubAuthProvider> _logger = logger;
    public ExternalProviderType ProviderType => ExternalProviderType.GitHub;

    public async Task<Result<ExternalAuthToken>> RequestAccessToken(
        string code,
        CancellationToken cancellationToken)
    {
        // Validate token endpoint configuration
        var tokenEndpoint = gitHubEndpoints.Value?.GitHubToken;
        if (string.IsNullOrWhiteSpace(tokenEndpoint) || !Uri.IsWellFormedUriString(tokenEndpoint, UriKind.Absolute))
        {
            _logger.LogError("GitHub token endpoint is not configured correctly. Value: '{TokenEndpoint}'",
                tokenEndpoint);
            return Result.Failure<ExternalAuthToken>(
                HttpStatusCode.InternalServerError,
                DefaultErrors.InternalServerError("GitHub token endpoint is misconfigured."));
        }

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = gitHubOptions.Value.ClientId,
            ["client_secret"] = gitHubOptions.Value.ClientSecret,
            ["code"] = code,
            ["redirect_uri"] = gitHubOptions.Value.RedirectUri
        });

        HttpRequestMessage request;
        try
        {
            request = new HttpRequestMessage(
                HttpMethod.Post,
                tokenEndpoint)
            {
                Content = content
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create GitHub token request for endpoint '{TokenEndpoint}'", tokenEndpoint);
            return Result.Failure<ExternalAuthToken>(
                HttpStatusCode.InternalServerError,
                DefaultErrors.InternalServerError("Failed to build request to GitHub token endpoint."));
        }

        // Use GitHub recommended media type and include a User-Agent header as required by the API
        request.Headers.Accept.Clear();
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        request.Headers.UserAgent.Clear();
        request.Headers.UserAgent.Add(new ProductInfoHeaderValue("AuthService", "1.0"));

        var response = await _client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("GitHub token endpoint returned non-success status {Status}: {Body}",
                response.StatusCode, body);

            return Result.Failure<ExternalAuthToken>(
                response.StatusCode,
                AuthorizationErrors.ExternalAuthFailed("Failed to obtain access token from GitHub."));
        }

        // Read raw body and try to deserialize explicitly so we can log raw content when things go wrong
        var tokenBody = await response.Content.ReadAsStringAsync(cancellationToken);
        GitHubTokenResponse? token = null;
        try
        {
            token = System.Text.Json.JsonSerializer.Deserialize<GitHubTokenResponse>(tokenBody);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize GitHub token response. Raw body: {Body}", tokenBody);
        }

        if (token is null)
        {
            _logger.LogWarning("GitHub token response deserialized to null. Raw body: {Body}", tokenBody);
            return Result.Failure<ExternalAuthToken>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("GitHub OAuth failed (invalid token response)"));
        }

        if (!string.IsNullOrEmpty(token.Error))
        {
            _logger.LogWarning("GitHub token response invalid: error={Error}, description={Description}. Raw body: {Body}", token.Error,
                token.ErrorDescription, tokenBody);
            return Result.Failure<ExternalAuthToken>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest(
                    token.ErrorDescription ?? "GitHub OAuth failed"));
        }

        if (string.IsNullOrWhiteSpace(token.AccessToken))
        {
            _logger.LogWarning("GitHub token response missing access_token. Raw body: {Body}", tokenBody);
            return Result.Failure<ExternalAuthToken>(
                HttpStatusCode.BadRequest,
                AuthorizationErrors.ExternalAuthFailed("Failed to obtain access token from GitHub."));
        }

        return Result<ExternalAuthToken>.Success(
            new ExternalAuthToken(token.AccessToken));
    }

    public async Task<Result<ExternalUserInfo>> RequestUserInfo(
        string accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Access token is empty"));

        // Validate userinfo endpoint configuration
        var userInfoEndpoint = gitHubEndpoints.Value?.GitHubUserInfo;
        if (string.IsNullOrWhiteSpace(userInfoEndpoint) ||
            !Uri.IsWellFormedUriString(userInfoEndpoint, UriKind.Absolute))
        {
            _logger.LogError("GitHub userinfo endpoint is not configured correctly. Value: '{UserInfoEndpoint}'",
                userInfoEndpoint);
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.InternalServerError,
                DefaultErrors.InternalServerError("GitHub userinfo endpoint is misconfigured."));
        }

        HttpRequestMessage request;
        try
        {
            request = new HttpRequestMessage(
                HttpMethod.Get,
                userInfoEndpoint);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create GitHub userinfo request for endpoint '{UserInfoEndpoint}'",
                userInfoEndpoint);
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.InternalServerError,
                DefaultErrors.InternalServerError("Failed to build request to GitHub userinfo endpoint."));
        }

        // GitHub requires User-Agent; use GitHub recommended media type
        request.Headers.Accept.Clear();
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        request.Headers.UserAgent.Clear();
        request.Headers.UserAgent.Add(new ProductInfoHeaderValue("AuthService", "1.0"));

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("GitHub userinfo endpoint returned non-success status {Status}: {Body}",
                response.StatusCode, body);
            return Result.Failure<ExternalUserInfo>(
                response.StatusCode,
                AuthorizationErrors.ExternalAuthFailed());
        }

        var userBody = await response.Content.ReadAsStringAsync(cancellationToken);
        ExternalUserInfo? user = null;
        try
        {
            user = System.Text.Json.JsonSerializer.Deserialize<ExternalUserInfo>(userBody);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize GitHub userinfo response. Raw body: {Body}", userBody);
        }

        if (user is null)
        {
            _logger.LogWarning("GitHub userinfo deserialization failed or returned empty. Raw body: {Body}", userBody);
            return Result.Failure<ExternalUserInfo>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("GitHub did not return required user information"));
        }

        if (string.IsNullOrWhiteSpace(user.Picture) || string.IsNullOrWhiteSpace(user.Sub))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(userBody);
                var root = doc.RootElement;

                if (string.IsNullOrWhiteSpace(user.Picture) &&
                    root.TryGetProperty("avatar_url", out var avatarProp) &&
                    avatarProp.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    var avatar = avatarProp.GetString();
                    if (!string.IsNullOrWhiteSpace(avatar))
                    {
                        user.Picture = avatar!;
                    }
                }

                if (string.IsNullOrWhiteSpace(user.Sub))
                {
                    if (root.TryGetProperty("id", out var idProp))
                    {
                        user.Sub = ExtractGitHubIdentifier(idProp);
                    }

                    if (string.IsNullOrWhiteSpace(user.Sub) &&
                        root.TryGetProperty("node_id", out var nodeIdProp) &&
                        nodeIdProp.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        user.Sub = nodeIdProp.GetString() ?? string.Empty;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to extract GitHub metadata from userinfo payload");
            }
        }

        // If GitHub didn't include email on /user, try /user/emails to fetch primary/verified email
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            _logger.LogInformation("GitHub userinfo did not include email; attempting emails endpoint to fetch additional addresses.");

            var emailsEndpoint = gitHubEndpoints.Value?.GitHubEmails ?? "https://api.github.com/user/emails";
            if (Uri.IsWellFormedUriString(emailsEndpoint, UriKind.Absolute))
                try
                {
                    var emailReq = new HttpRequestMessage(HttpMethod.Get, emailsEndpoint);
                    emailReq.Headers.Accept.Clear();
                    emailReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
                    emailReq.Headers.UserAgent.Clear();
                    emailReq.Headers.UserAgent.Add(new ProductInfoHeaderValue("AuthService", "1.0"));
                    emailReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                    var emailResp = await _client.SendAsync(emailReq, cancellationToken);
                    var emailBody = await emailResp.Content.ReadAsStringAsync(cancellationToken);
                    if (emailResp.IsSuccessStatusCode)
                    {
                        List<GitHubEmailEntry>? emails = null;
                        try
                        {
                            emails = System.Text.Json.JsonSerializer.Deserialize<List<GitHubEmailEntry>>(emailBody);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to deserialize GitHub emails response. Raw body: {Body}", emailBody);
                        }

                        var chosen = emails?.FirstOrDefault(e => e.Primary && e.Verified) ??
                                     emails?.FirstOrDefault(e => e.Verified) ?? emails?.FirstOrDefault();
                        if (chosen is not null && !string.IsNullOrWhiteSpace(chosen.Email))
                        {
                            user.Email = chosen.Email;
                            _logger.LogInformation("GitHub emails endpoint provided fallback email: {EmailPreview}", user.Email?.Substring(0, Math.Min(8, user.Email?.Length ?? 0)));
                        }
                        else
                        {
                            _logger.LogWarning("GitHub emails endpoint returned no usable emails. Raw body: {Body}", emailBody);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("GitHub emails endpoint returned non-success status {Status}: {Body}",
                            emailResp.StatusCode, emailBody);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to call GitHub emails endpoint");
                }
            else
                _logger.LogWarning("GitHub emails endpoint is not configured or invalid: {Endpoint}", emailsEndpoint);
        }

        // Do not fail here if email is missing; return partial user info so caller
        // can decide to create a pending user and ask for missing fields (email).
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            _logger.LogWarning("GitHub did not provide an email for the user after fallback. Returning partial user info for pending flow.");
        }

        return Result<ExternalUserInfo>.Success(user);
    }

    private static string ExtractGitHubIdentifier(System.Text.Json.JsonElement element)
    {
        return element.ValueKind switch
        {
            System.Text.Json.JsonValueKind.String => element.GetString() ?? string.Empty,
            System.Text.Json.JsonValueKind.Number => element.TryGetInt64(out var number)
                ? number.ToString(CultureInfo.InvariantCulture)
                : element.GetRawText(),
            _ => string.Empty
        };
    }

    public AuthorizationUrlResponse BuildAuthQuery(string state, string[] scopes)
    {
        // Defensive checks with clear logging to diagnose missing configuration
        var clientId = gitHubOptions.Value?.ClientId;
        var redirect = gitHubOptions.Value?.RedirectUri;
        var authorizeBase = gitHubEndpoints.Value?.GitHubAuthorize;

        if (string.IsNullOrWhiteSpace(authorizeBase))
        {
            _logger.LogWarning(
                "GitHub endpoints: GitHubAuthorize is not configured. Falling back to default GitHub authorize URL.");
            authorizeBase = "https://github.com/login/oauth/authorize";
        }

        if (string.IsNullOrWhiteSpace(clientId))
        {
            _logger.LogError("GitHub options: ClientId is not configured.");
            throw new InvalidOperationException("GitHub client id is not configured.");
        }

        if (string.IsNullOrWhiteSpace(redirect))
        {
            _logger.LogError("GitHub options: RedirectUri is not configured.");
            throw new InvalidOperationException("GitHub redirect uri is not configured.");
        }

        _logger.LogInformation("Building GitHub authorization URL (client={ClientId}, redirect={Redirect})", clientId,
            redirect);

        var query = new Dictionary<string, string?>
        {
            ["client_id"] = clientId,
            ["redirect_uri"] = redirect,
            ["response_type"] = "code",
            ["scope"] = string.Join(' ', scopes),
            ["state"] = state
        };

        var authorizationUrl = QueryHelpers.AddQueryString(authorizeBase, query);

        return new AuthorizationUrlResponse(authorizationUrl, state);
    }

    private sealed record GitHubEmailEntry
    {
        public string Email { get; } = string.Empty;
        public bool Primary { get; init; }
        public bool Verified { get; init; }
        public string? Visibility { get; init; }
    }
}