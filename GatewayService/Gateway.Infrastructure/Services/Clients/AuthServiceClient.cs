using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Dto.Auth;
using Gateway.Application.Dto.Register;
using Gateway.Common.HttpUrls;
using Gateway.Common.ResultPattern;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class AuthServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<AuthEndpoint> endpoint) : IAuthServiceClient
{
    private readonly string _registerRoute = endpoint.Value.AuthEndpointUrl;
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.AuthService);

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken) =>
        await _client.SendHttpRequestAsync<RegisterRequest, AuthResponse>(
            HttpMethod.Post,
            _registerRoute,
            request,
            SerializerOptions,
            cancellationToken);
}