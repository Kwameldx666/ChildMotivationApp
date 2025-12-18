using System.Text.Json;
using FamilyQuest.Gateway.Application.Abstractions.Infrastructure;
using FamilyQuest.Gateway.Application.Dto.Login;
using FamilyQuest.Gateway.Common.HttpUrls;
using FamilyQuest.Gateway.Common.ResultPattern;
using FamilyQuest.Gateway.Infrastructure.Extensions;
using FamilyQuest.Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace FamilyQuest.Gateway.Infrastructure.Services.Clients;

public class AuthServiceClient(
    IOptionsSnapshot<AuthEndpoint> options,
    IHttpClientFactory clientFactory)
    : IAuthServiceClient
{
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.AuthService);
    private readonly AuthEndpoint _endpoint = options.Value;

    public async Task<Result> RegisterAsync(LoginRequest loginRequest, CancellationToken cancellationToken)
        => await _client.SendHttpRequestAsync<LoginRequest, Result>(HttpMethod.Post, _endpoint.AuthEndpointUrl,
            loginRequest, JsonSerializerOptions.Web, cancellationToken);
}