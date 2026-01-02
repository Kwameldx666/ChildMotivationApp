using System.Globalization;
using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public sealed class AiServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<AiEndpoints> endpoints)
    : IAiServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.AiService);
    private readonly AiEndpoints _endpoints = endpoints.Value;

    public Task<HttpResponseMessage> GetTaskSuggestionsAsync(object request, CancellationToken cancellationToken = default)
    {
        var uri = BuildPath(_endpoints.TaskSuggestions);
        return _client.SendHttpRequestAsync(HttpMethod.Post, uri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetRewardSuggestionsAsync(object request, CancellationToken cancellationToken = default)
    {
        var uri = BuildPath(_endpoints.RewardSuggestions);
        return _client.SendHttpRequestAsync(HttpMethod.Post, uri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> SendChatAsync(object request, CancellationToken cancellationToken = default)
    {
        var uri = BuildPath(_endpoints.Chat);
        return _client.SendHttpRequestAsync(HttpMethod.Post, uri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetAnalyticsAsync(
        string userId,
        string? familyId,
        int? windowDays,
        int? maxInsights,
        CancellationToken cancellationToken = default)
    {
        var uri = BuildPath(_endpoints.Analytics);
        var query = new Dictionary<string, string?>
        {
            ["userId"] = userId
        };

        if (!string.IsNullOrWhiteSpace(familyId))
        {
            query["familyId"] = familyId;
        }

        if (windowDays.HasValue)
        {
            query["windowDays"] = windowDays.Value.ToString(CultureInfo.InvariantCulture);
        }

        if (maxInsights.HasValue)
        {
            query["maxInsights"] = maxInsights.Value.ToString(CultureInfo.InvariantCulture);
        }

        uri = QueryHelpers.AddQueryString(uri, query);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, uri, null, SerializerOptions, cancellationToken);
    }

    private static string BuildPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) throw new InvalidOperationException("AI service endpoint is not configured.");
        return path.Trim('/');
    }
}
