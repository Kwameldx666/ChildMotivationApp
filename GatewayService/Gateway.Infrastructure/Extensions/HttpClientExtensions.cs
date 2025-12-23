using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace Gateway.Infrastructure.Extensions;

public static class HttpClientExtensions
{
    public static async Task<HttpResponseMessage> SendHttpRequestAsync<TBody>(
        this HttpClient httpClient,
        HttpMethod httpMethod,
        string requestUri,
        TBody? body = null,
        JsonSerializerOptions? options = null,
        CancellationToken cancellationToken = default)
        where TBody : class
    {
        using var request = new HttpRequestMessage(httpMethod, requestUri);

        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: options);
        }

        return await httpClient.SendAsync(request, cancellationToken);
    }
}