using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Dto.Auth;
using Gateway.Application.Dto.Login;
using Gateway.Application.Dto.Register;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Mapster;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class AuthServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<AuthEndpoints> endpoint)
    : IAuthServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.AuthService);
    private readonly AuthEndpoints _endpoints = endpoint.Value;

    public async Task<HttpResponseMessage> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        if (request.Profile is null)
            throw new ArgumentException("Profile data is required to register a user.", nameof(request));

        var adaptedRequest = request.Adapt<AuthServiceRegisterRequest>();

        return await _client.SendHttpRequestAsync(
            HttpMethod.Post,
            _endpoints.Register,
            adaptedRequest,
            SerializerOptions,
            cancellationToken);
    }

    public async Task<HttpResponseMessage> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync(
            HttpMethod.Post,
            _endpoints.Login,
            request,
            SerializerOptions,
            cancellationToken);
    }

    public async Task<HttpResponseMessage> RefreshAsync(RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync(
            HttpMethod.Post,
            _endpoints.Refresh,
            request,
            SerializerOptions,
            cancellationToken);
    }

    public async Task<HttpResponseMessage> GetGoogleAuthorizationAsync(CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            _endpoints.GoogleAuthorize,
            options: SerializerOptions,
            cancellationToken: cancellationToken);
    }

    public async Task<HttpResponseMessage> GetSessionAsync(string token, CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            $"{_endpoints.Session}/{token}",
            options: SerializerOptions,
            cancellationToken: cancellationToken);
    }

    public async Task<HttpResponseMessage> GetPendingUserAsync(string token, CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            $"{_endpoints.Pending}/{token}",
            options: SerializerOptions,
            cancellationToken: cancellationToken);
    }

    public async Task<HttpResponseMessage> CompleteGoogleSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync(
            HttpMethod.Post,
            _endpoints.GoogleComplete,
            request,
            SerializerOptions,
            cancellationToken);
    }

    public async Task<HttpResponseMessage> GetGitHubAuthorizationAsync(CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            _endpoints.GitHubAuthorize,
            options: SerializerOptions,
            cancellationToken: cancellationToken);
    }

    public async Task<HttpResponseMessage> CompleteGitHubSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync(
            HttpMethod.Post,
            _endpoints.GitHubComplete,
            request,
            SerializerOptions,
            cancellationToken);
    }

    public async Task<HttpResponseMessage> GetDiscordAuthorizationAsync(CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            _endpoints.DiscordAuthorize,
            options: SerializerOptions,
            cancellationToken: cancellationToken);
    }

    public async Task<HttpResponseMessage> CompleteDiscordSignInAsync(CompleteExternalSignInRequest request,
        CancellationToken cancellationToken)
    {
        return await _client.SendHttpRequestAsync(
            HttpMethod.Post,
            _endpoints.DiscordComplete,
            request,
            SerializerOptions,
            cancellationToken);
    }
}