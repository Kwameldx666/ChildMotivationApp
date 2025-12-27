using System.Net.Http.Headers;
using AuthService.Application.Abstractions.Authentication.External;
using AuthService.Application.Dto.User;
using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Infrastructure.Constants;
using AuthService.Infrastructure.Options.External;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Services.Authentication.External;

public class GoogleAuthProvider(
    IOptions<GoogleEndpoints> googleEndpoints,
    IOptions<GoogleOptions> googleOptions,
    IHttpClientFactory clientFactory) :
    IExternalAuthProvider
{
    private readonly GoogleEndpoints _googleEndpoints = googleEndpoints.Value;
    private readonly GoogleOptions _googleOptions = googleOptions.Value;
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.Google);

    public async Task<HttpResponseMessage> RequestAccessToken(string code, CancellationToken cancellationToken)
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

        return response;
    }

    public async Task<HttpResponseMessage> RequestUserInfo(string accessToken, CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, _googleEndpoints.GoogleUserInfo);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        
        var response = await _client.SendAsync(request, cancellationToken);
        return response;
    }

    public AuthorizationResponse BuildAuthQuery(string state, string[] scopes)
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

        var response = new AuthorizationResponse(authorizationUrl, state);
        return response;
    }
}