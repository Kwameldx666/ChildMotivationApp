using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Dto.Profile;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class UserServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<UserEndpoints> endpoints)
    : IUserServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.UserService);
    private readonly UserEndpoints _endpoints = endpoints.Value;

    public Task<HttpResponseMessage> GetProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var requestUri = BuildProfilePath(userId);
        return _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            requestUri,
            null,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> GetCurrentProfileAsync(CancellationToken cancellationToken)
    {
        var requestUri = BuildProfileMePath();
        return _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            requestUri,
            null,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> UpdateProfileAsync(Guid userId, UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var requestUri = BuildProfilePath(userId);
        return _client.SendHttpRequestAsync(
            HttpMethod.Put,
            requestUri,
            request,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> UploadAvatarAsync(Guid userId, System.IO.Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        var requestUri = BuildProfilePath(userId) + "/avatar";

        using var content = new MultipartFormDataContent();
        var streamContent = new StreamContent(fileStream);
        if (!string.IsNullOrWhiteSpace(contentType)) streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        content.Add(streamContent, "file", fileName);

        var request = new HttpRequestMessage(HttpMethod.Post, requestUri)
        {
            Content = content
        };

        return _client.SendAsync(request, cancellationToken);
    }

    private string BuildProfilePath(Guid userId)
    {
        var basePath = _endpoints.Profile;
        if (string.IsNullOrWhiteSpace(basePath))
            throw new InvalidOperationException("UserService profile endpoint is not configured.");

        return $"{basePath.TrimEnd('/')}/{userId}";
    }

    private string BuildProfileMePath()
    {
        if (!string.IsNullOrWhiteSpace(_endpoints.ProfileMe)) return _endpoints.ProfileMe;

        var basePath = _endpoints.Profile;
        if (string.IsNullOrWhiteSpace(basePath))
            throw new InvalidOperationException("UserService profile endpoint is not configured.");

        return $"{basePath.TrimEnd('/')}/me";
    }
}