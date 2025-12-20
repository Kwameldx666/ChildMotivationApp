using System.Net;
using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Dto.Register;
using Gateway.Common.HttpUrls;
using Gateway.Common.ResultPattern;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class AuthServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<AuthEndpoints> endpoint) : IAuthServiceClient
{
    private readonly string _registerRoute = endpoint.Value.AuthEndpointUrl;
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.AuthService);

    public async Task<HttpResponseMessage> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var payload = new AuthServiceRegisterRequest(
            request.Email,
            request.Password,
            request.Role,
            request.Profile.Name,
            request.Profile.LastName,
            string.IsNullOrWhiteSpace(request.Profile.Avatar) ? null : request.Profile.Avatar,
            request.Profile.Age,
            request.Family?.Code,
            request.Family?.Name,
            request.Family?.Emblem);

          return   await _client.SendHttpRequestAsync(
                HttpMethod.Post,
                _registerRoute,
                payload,
                SerializerOptions,
                cancellationToken);
      
    }
}