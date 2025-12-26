using System.Net.Http.Headers;
using AuthService.Application.Abstractions.Infrastructure.Clients;
using AuthService.Common.Constants.HttpUrls;
using AuthService.Common.ExternalOptions.SignIn;
using AuthService.Infrastructure.Constants;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Services.Clients;

public class GoogleServiceClient(
    IOptions<GoogleEndpoints> googleEndpoints,
    IOptions<GoogleOptions> googleOptions,
    IHttpClientFactory clientFactory) : IGoogleServiceClient
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
        // Use Bearer Authorization header as recommended by Google
        var request = new HttpRequestMessage(HttpMethod.Get, _googleEndpoints.GoogleUserInfo);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var response = await _client.SendAsync(request, cancellationToken);
        return response;
    }
}