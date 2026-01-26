using System.Net.Http.Headers;
using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Extensions;
using Gateway.Infrastructure.Services.Constants;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class TaskServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<TaskEndpoints> endpoints)
    : ITaskServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.TaskService);
    private readonly TaskEndpoints _endpoints = endpoints.Value;

    public Task<HttpResponseMessage> GetAllAsync(
        string? createdByUserId = null,
        string? assignedToUserId = null,
        CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTasksPath();
        if (!string.IsNullOrWhiteSpace(createdByUserId))
            requestUri = QueryHelpers.AddQueryString(requestUri, "createdByUserId", createdByUserId);
        if (!string.IsNullOrWhiteSpace(assignedToUserId))
            requestUri = QueryHelpers.AddQueryString(requestUri, "assignedToUserId", assignedToUserId);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> CreateAsync(object request, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTasksPath();
        return _client.SendHttpRequestAsync(HttpMethod.Post, requestUri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> UpdateAsync(Guid id, object request, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id);
        return _client.SendHttpRequestAsync(HttpMethod.Put, requestUri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Delete, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> CompleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id) + "/complete";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Post, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> UploadEvidenceAsync(
        Guid id,
        Stream content,
        string fileName,
        string contentType,
        string uploadedByUserId,
        CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id) + "/evidence";
        if (content.CanSeek) content.Seek(0, SeekOrigin.Begin);

        var form = new MultipartFormDataContent();
        var streamContent = new StreamContent(content);
        if (!string.IsNullOrWhiteSpace(contentType))
            streamContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        form.Add(streamContent, "file", fileName);
        form.Add(new StringContent(uploadedByUserId), "uploadedByUserId");

        var request = new HttpRequestMessage(HttpMethod.Post, requestUri)
        {
            Content = form
        };

        return _client.SendAsync(request, cancellationToken);
    }

    public Task<HttpResponseMessage> DownloadEvidenceAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id) + "/evidence";
        var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        return _client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
    }

    public Task<HttpResponseMessage> GetMissionsAsync(string userId, string? recurrence,
        CancellationToken cancellationToken = default)
    {
        var requestUri = BuildMissionsPath();
        var query = new Dictionary<string, string?>
        {
            ["userId"] = userId
        };

        if (!string.IsNullOrWhiteSpace(recurrence)) query["recurrence"] = recurrence;

        requestUri = QueryHelpers.AddQueryString(requestUri, query);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> UpdateMissionProgressAsync(Guid missionId, object request,
        CancellationToken cancellationToken = default)
    {
        var requestUri = BuildMissionsPath() + $"/{missionId}/progress";
        return _client.SendHttpRequestAsync(HttpMethod.Post, requestUri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetAchievementsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildAchievementsPath();
        requestUri = QueryHelpers.AddQueryString(requestUri, "userId", userId);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    public Task<HttpResponseMessage> UpdateAchievementProgressAsync(Guid achievementId, object request,
        CancellationToken cancellationToken = default)
    {
        var requestUri = BuildAchievementsPath() + $"/{achievementId}/progress";
        return _client.SendHttpRequestAsync(HttpMethod.Post, requestUri, request, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetAnalyticsAsync(string userId, int windowDays,
        CancellationToken cancellationToken = default)
    {
        var requestUri = "task-service/analytics";
        requestUri = QueryHelpers.AddQueryString(requestUri, "userId", userId);
        requestUri = QueryHelpers.AddQueryString(requestUri, "windowDays", windowDays.ToString());
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions,
            cancellationToken);
    }

    private string BuildTasksPath()
    {
        var basePath = _endpoints.Tasks;
        if (string.IsNullOrWhiteSpace(basePath))
            throw new InvalidOperationException("TaskService tasks endpoint is not configured.");
        return basePath.TrimEnd('/');
    }

    private string BuildTaskPath(Guid id)
    {
        var basePath = BuildTasksPath();
        return $"{basePath}/{id}";
    }

    private string BuildMissionsPath()
    {
        var basePath = _endpoints.Missions;
        if (string.IsNullOrWhiteSpace(basePath))
            throw new InvalidOperationException("TaskService missions endpoint is not configured.");
        return basePath.TrimEnd('/');
    }

    private string BuildAchievementsPath()
    {
        var basePath = _endpoints.Achievements;
        if (string.IsNullOrWhiteSpace(basePath))
            throw new InvalidOperationException("TaskService achievements endpoint is not configured.");
        return basePath.TrimEnd('/');
    }
}