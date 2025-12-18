using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Gateway.Common.ResultPattern;

namespace Gateway.Infrastructure.Extensions;

public static class HttpClientExtensions
{
    public static async Task<Result<T>> SendHttpRequestAsync<TB, T>(
        this HttpClient httpClient,
        HttpMethod httpMethod,
        string requestUri,
        TB? body = null,
        JsonSerializerOptions? options = null,
        CancellationToken cancellationToken = default
    ) where TB : class
    {
        using var request = new HttpRequestMessage(httpMethod, requestUri);

        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: options);
        }

        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return Result.Failure<T>(
                (int)HttpStatusCode.ServiceUnavailable,
                DefaultErrors.InternalServerError(ex.Message)
            );
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                return Result.Failure<T>(
                    (int)response.StatusCode,
                    DefaultErrors.InternalServerError(errorContent)
                );
            }

            if (response.StatusCode == HttpStatusCode.NoContent ||
                response.Content.Headers.ContentLength is 0 ||
                response.Content.Headers.ContentType is null)
            {
                return Result<T>.Success(default!);
            }

            var result = await response.Content.ReadFromJsonAsync<T>(options, cancellationToken);
                        if (result is null)
            {
                return Result.Failure<T>(
                    (int)HttpStatusCode.InternalServerError,
                    DefaultErrors.InternalServerError("Response content was null or could not be deserialized.")
                );
            }

            return Result<T>.Success(result);
        }
    }
}