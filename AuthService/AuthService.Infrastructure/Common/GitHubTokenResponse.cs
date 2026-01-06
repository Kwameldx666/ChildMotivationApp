using System.Text.Json.Serialization;

namespace AuthService.Infrastructure.Common;

public sealed class GitHubTokenResponse
{
    [JsonPropertyName("access_token")] public string? AccessToken { get; init; }

    [JsonPropertyName("token_type")] public string? TokenType { get; init; }

    [JsonPropertyName("error")] public string? Error { get; init; }

    [JsonPropertyName("error_description")] public string? ErrorDescription { get; init; }
}