using System.Net.Http.Json;

namespace AuthService.Infrastructure.Extensions;

public static class HttpClientExtensions
{
    public static async Task<HttpResponseMessage> ToHttpRequest<TBody>(this HttpClient client, HttpMethod method,
        string requestUrl, TBody? body = null,
        CancellationToken cancellationToken = default)
        where TBody : class
    {
        var request = new HttpRequestMessage(method, requestUrl);

        if (body is not null) request.Content = JsonContent.Create(body);

        return await client.SendAsync(request, cancellationToken);
    }
}