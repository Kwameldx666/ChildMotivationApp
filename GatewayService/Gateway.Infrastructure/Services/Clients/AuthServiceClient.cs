using System;
using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
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
    private readonly AuthEndpoints _endpoints = endpoint.Value;
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.AuthService);

    public async Task<HttpResponseMessage> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        if (request.Profile is null)
        {
            throw new ArgumentException("Profile data is required to register a user.", nameof(request));
        }

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
}