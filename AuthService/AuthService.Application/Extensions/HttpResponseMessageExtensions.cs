using System.Net;
using System.Net.Http.Json;
using AuthService.Common.Constants.Errors;
using AuthService.Common.ResultPattern;

namespace AuthService.Application.Extensions;

public static class HttpResponseMessageExtensions
{
    public static async Task<Result<T>> EnsureSuccessAndReadJsonAsync<T>(this HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
        {
            var errorPayload = await response.Content.ReadAsStringAsync();
            var cleanedPayload = string.IsNullOrWhiteSpace(errorPayload) ? null : errorPayload.Trim();
            var description = cleanedPayload is null
                ? $"Request failed with status code {response.StatusCode}"
                : $"Request failed with status code {response.StatusCode}: {cleanedPayload}";

            // Make common Google OAuth errors more actionable
            if (cleanedPayload != null &&
                cleanedPayload.Contains("invalid_request", StringComparison.OrdinalIgnoreCase) &&
                cleanedPayload.Contains("Invalid Credentials", StringComparison.OrdinalIgnoreCase))
                description = description +
                              " - Google indicates invalid credentials or redirect URI mismatch. Verify ClientId, ClientSecret and RedirectUri in Google Cloud Console.";

            return Result.Failure<T>(
                response.StatusCode,
                DefaultErrors.BadRequest(description));
        }

        var result = await response.Content.ReadFromJsonAsync<T>();
        if (result is null)
            return Result.Failure<T>(
                HttpStatusCode.BadRequest,
                DefaultErrors.BadRequest("Response content is empty"));

        return Result<T>.Success(result);
    }
}