using System.Text.Json.Serialization;

namespace AuthService.Infrastructure.Services.OAuth.GitHub;

public sealed record GitHubTokenResponse
{
    [JsonPropertyName("access_token")] public string? AccessToken { get; init; }
    [JsonPropertyName("token_type")] public string? TokenType { get; init; }
    [JsonPropertyName("scope")] public string? Scope { get; init; }

    [JsonPropertyName("error")] public string? Error { get; init; }

    [JsonPropertyName("error_description")]
    public string? ErrorDescription { get; init; }
}