using System.ComponentModel.DataAnnotations;

namespace AuthService.Infrastructure.ExternalOptions.JwtBearer;

public class JwtBearerOptions
{
    [Required] public string Issuer { get; set; } = string.Empty;

    [Required] public string Audience { get; set; } = string.Empty;

    [Required] public string Secret { get; set; } = string.Empty;

    [Range(1, int.MaxValue)] public int AccessTokenLifetime { get; set; } = 15;

    [Required] public int RefreshTokenLength { get; set; }

    [Required] public int RefreshTokenLifetime { get; set; }
}