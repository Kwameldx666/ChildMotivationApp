using System.Text.Json;
using Gateway.Application.Abstractions.Infrastructure;
using Gateway.Common.HttpUrls;
using Gateway.Infrastructure.Services.Constants;
using Gateway.Infrastructure.Extensions;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public class TaskServiceClient(IHttpClientFactory clientFactory, IOptionsSnapshot<TaskEndpoints> endpoints)
    : ITaskServiceClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = clientFactory.CreateClient(DefaultHttpClientNames.TaskService);
    private readonly TaskEndpoints _endpoints = endpoints.Value;

    public Task<HttpResponseMessage> GetAllAsync(string? createdByUserId = null, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTasksPath();
        if (!string.IsNullOrWhiteSpace(createdByUserId))
            requestUri = QueryHelpers.AddQueryString(requestUri, "createdByUserId", createdByUserId);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id);
        return _client.SendHttpRequestAsync<object>(HttpMethod.Get, requestUri, null, SerializerOptions, cancellationToken);
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
        return _client.SendHttpRequestAsync<object>(HttpMethod.Delete, requestUri, null, SerializerOptions, cancellationToken);
    }

    public Task<HttpResponseMessage> CompleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requestUri = BuildTaskPath(id) + "/complete";
        return _client.SendHttpRequestAsync<object>(HttpMethod.Post, requestUri, null, SerializerOptions, cancellationToken);
    }

    private string BuildTasksPath()
    {
        var basePath = _endpoints.Tasks;
        if (string.IsNullOrWhiteSpace(basePath)) throw new InvalidOperationException("TaskService tasks endpoint is not configured.");
        return basePath.TrimEnd('/');
    }

    private string BuildTaskPath(Guid id)
    {
        var basePath = BuildTasksPath();
        return $"{basePath}/{id}";
    }
}
