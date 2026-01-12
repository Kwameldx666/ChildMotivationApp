using System.Net.Http.Json;
using Gateway.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace Gateway.Infrastructure.Services.Clients;

public interface IFamilyChatClient
{
    Task<HttpResponseMessage> GetMessagesAsync(string familyId, int limit = 50, DateTime? before = null, CancellationToken cancellationToken = default);
    Task<HttpResponseMessage> SendMessageAsync(string familyId, object request, CancellationToken cancellationToken = default);
}

public class FamilyChatClient : IFamilyChatClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public FamilyChatClient(IHttpClientFactory httpClientFactory, IOptions<UserServiceOptions> options)
    {
        _httpClient = httpClientFactory.CreateClient("UserService");
        _baseUrl = options.Value.BaseUrl ?? throw new InvalidOperationException("UserService BaseUrl not configured");
    }

    public Task<HttpResponseMessage> GetMessagesAsync(string familyId, int limit = 50, DateTime? before = null, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/family-chat/{familyId}?limit={limit}";
        if (before.HasValue)
        {
            url += $"&before={before.Value:O}";
        }
        return _httpClient.GetAsync(url, cancellationToken);
    }

    public Task<HttpResponseMessage> SendMessageAsync(string familyId, object request, CancellationToken cancellationToken = default)
    {
        var url = $"{_baseUrl}/family-chat/{familyId}/messages";
        return _httpClient.PostAsJsonAsync(url, request, cancellationToken);
    }
}