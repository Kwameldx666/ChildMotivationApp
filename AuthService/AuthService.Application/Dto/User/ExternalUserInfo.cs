using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace AuthService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public class ExternalUserInfo
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("picture")]
    public string Picture { get; set; } = string.Empty;
    
    [JsonPropertyName("sub")]
    public string Sub { get; set; } = string.Empty;
}

