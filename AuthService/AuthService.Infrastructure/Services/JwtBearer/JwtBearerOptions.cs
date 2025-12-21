using System.ComponentModel.DataAnnotations;

namespace AuthService.Infrastructure.Services.JwtBearer;

public class JwtBearerOptions
{
    [Required]
    public string Issuer { get; set; } = string.Empty;

    [Required]
    public string Audience { get; set; } = string.Empty;

    [Required]
    public string Secret { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int AccessTokenLifetime { get; set; }
}