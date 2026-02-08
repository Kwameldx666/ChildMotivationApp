using System.Net.Http.Headers;
using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Application.Features.User.DTOs;
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

    public Task<HttpResponseMessage> GetFamilyMembersAsync(Guid userId, CancellationToken cancellationToken)
    {
        var requestUri = BuildFamilyMembersPath(userId);
        return _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            requestUri,
            null,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> GetCurrentFamilyMembersAsync(CancellationToken cancellationToken)
    {
        var requestUri = BuildFamilyMembersMePath();
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

    public Task<HttpResponseMessage> UploadAvatarAsync(Guid userId, Stream fileStream, string fileName,
        string contentType, CancellationToken cancellationToken)
    {
        var requestUri = BuildProfilePath(userId) + "/avatar";

        using var content = new MultipartFormDataContent();
        var streamContent = new StreamContent(fileStream);
        if (!string.IsNullOrWhiteSpace(contentType))
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(streamContent, "file", fileName);

        var request = new HttpRequestMessage(HttpMethod.Post, requestUri)
        {
            Content = content
        };

        return _client.SendAsync(request, cancellationToken);
    }

    // Subscription methods
    public Task<HttpResponseMessage> GetCurrentSubscriptionAsync(CancellationToken cancellationToken)
    {
        var requestUri = _endpoints.SubscriptionMe ?? "user-service/subscription/me";
        return _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            requestUri,
            null,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> GetSubscriptionAsync(Guid userId, CancellationToken cancellationToken)
    {
        var basePath = _endpoints.Subscription ?? "user-service/subscription";
        var requestUri = basePath.Contains("{userId}")
            ? basePath.Replace("{userId}", userId.ToString())
            : $"{basePath.TrimEnd('/')}/{userId}";
        return _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            requestUri,
            null,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> ChangeSubscriptionAsync(ChangeSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        var requestUri = _endpoints.SubscriptionChange ?? "user-service/subscription/change";
        return _client.SendHttpRequestAsync(
            HttpMethod.Post,
            requestUri,
            request,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> CancelSubscriptionAsync(CancellationToken cancellationToken)
    {
        var requestUri = _endpoints.SubscriptionCancel ?? "user-service/subscription/cancel";
        return _client.SendHttpRequestAsync<object>(
            HttpMethod.Post,
            requestUri,
            null,
            SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> GetSubscriptionTiersAsync(CancellationToken cancellationToken)
    {
        var requestUri = _endpoints.SubscriptionTiers ?? "user-service/subscription/tiers";
        return _client.SendHttpRequestAsync<object>(
            HttpMethod.Get,
            requestUri,
            null,
            SerializerOptions,
            cancellationToken);
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

    private string BuildFamilyMembersPath(Guid userId)
    {
        if (!string.IsNullOrWhiteSpace(_endpoints.FamilyMembers))
            return _endpoints.FamilyMembers.Contains("{userId}")
                ? _endpoints.FamilyMembers.Replace("{userId}", userId.ToString())
                : $"{_endpoints.FamilyMembers.TrimEnd('/')}/{userId}";

        return $"{BuildProfilePath(userId)}/family-members";
    }

    private string BuildFamilyMembersMePath()
    {
        if (!string.IsNullOrWhiteSpace(_endpoints.FamilyMembersMe)) return _endpoints.FamilyMembersMe;

        return $"{BuildProfileMePath()}/family-members";
    }
}