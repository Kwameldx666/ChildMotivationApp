using System.Text.Json.Serialization;

namespace AuthService.Application.Features.Authentication.External.Google.SignIn;

public sealed class GoogleTokenResponse
{
    [JsonPropertyName("access_token")] public string? AccessToken { get; init; }

    [JsonPropertyName("id_token")] public string? IdToken { get; init; }

    [JsonPropertyName("token_type")] public string? TokenType { get; init; }

    [JsonPropertyName("expires_in")] public int? ExpiresIn { get; init; }

    [JsonPropertyName("error")] public string? Error { get; init; }

    [JsonPropertyName("error_description")]
    public string? ErrorDescription { get; init; }
}