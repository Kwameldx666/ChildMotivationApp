using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Dto.Register;
using Gateway.Common.HttpUrls;
using Gateway.Common.ResultPattern;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class AuthServiceClient(
    IOptionsSnapshot<AuthEndpoint> options,
    IHttpClientFactory clientFactory)
    : IAuthServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.AuthService);
    private readonly AuthEndpoint _endpoint = options.Value;

    public async Task<Result> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken) =>
        await _client.SendHttpRequestAsync<RegisterRequest, object>(
            HttpMethod.Post,
            _endpoint.AuthEndpointUrl,
            request,
            SerializerOptions,
            cancellationToken);
}