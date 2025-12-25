using Microsoft.AspNetCore.Mvc;

namespace Gateway.Extensions;

public static class HttpResponseMessageExtensions
{
    public static async Task<IActionResult> ToActionResultAsync(this HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return new ContentResult
        {
            StatusCode = (int)response.StatusCode,
            Content = content,
            ContentType = response.Content.Headers.ContentType?.ToString() ?? "application/json"
        };
    }
}