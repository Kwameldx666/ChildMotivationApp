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

    public Task<HttpResponseMessage> GetOnlineStatusesAsync(List<string> userIds,
        CancellationToken cancellationToken = default)
    {
        var normalizedUserIds = (userIds ?? [])
            .Select(userId => userId?.Trim())
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (normalizedUserIds.Count == 0)
        {
            throw new ArgumentException("At least one userId is required.", nameof(userIds));
        }

        var query = string.Join("&", normalizedUserIds.Select(userId => $"userIds={Uri.EscapeDataString(userId!)}"));
        var requestUri = $"{_endpoints.PresenceBase}/online?{query}";

        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> SendTaskNotificationAsync(string endpoint, object request,
        CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.SendBase}/{endpoint}";
        return _client.SendHttpRequestAsync(HttpMethod.Post, requestUri, request, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> SendGeneralNotificationAsync(object request,
        CancellationToken cancellationToken = default)
    {
        var requestUri = $"{_endpoints.SendBase}/general";
        return _client.SendHttpRequestAsync(HttpMethod.Post, requestUri, request, SerializerOptions,
            cancellationToken);
    }
}