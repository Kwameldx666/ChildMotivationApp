using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;

namespace Gateway.Infrastructure.Services.Models.JwtBearer;

[ExcludeFromCodeCoverage]

public class JwtBearerOptions
{
    [Required] public string Issuer { get; set; } = string.Empty;

    [Required] public string Audience { get; set; } = string.Empty;

    [Required] public string Secret { get; set; } = string.Empty;

    [Range(1, int.MaxValue)] public int AccessTokenLifetime { get; set; } = 15;
}

