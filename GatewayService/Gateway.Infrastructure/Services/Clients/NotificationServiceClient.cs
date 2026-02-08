using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class NotificationServiceClient(
    IHttpClientFactory clientFactory,
    IOptionsSnapshot<NotificationEndpoints> endpoints)
    : INotificationServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.NotificationService);
    private readonly NotificationEndpoints _endpoints = endpoints.Value;

    public Task<HttpResponseMessage> GetAllAsync(string userId, CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.Base}/{userId}";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> GetUnreadAsync(string userId, CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.Base}/{userId}/unread";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> GetUnreadCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.Base}/{userId}/unread/count";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> MarkAsReadAsync(string userId, List<string> notificationIds,
        CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.Base}/{userId}/mark-read";
        var payload = new { notificationIds };
        return _client.SendHttpRequestAsync(HttpMethod.Post, requestUri, payload, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> MarkAllAsReadAsync(string userId, CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.Base}/{userId}/mark-all-read";
        return _client.SendHttpRequestAsync(HttpMethod.Post, requestUri, new { }, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> DeleteAsync(string userId, Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.Base}/{userId}/{notificationId}";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Delete, requestUri, null, SerializerOptions,
            cancellationToken);
    }
}