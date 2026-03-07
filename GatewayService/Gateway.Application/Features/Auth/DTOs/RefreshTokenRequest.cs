using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public sealed record RefreshTokenRequest
{
    [Required(ErrorMessage = "Refresh token обязателен")]
    [StringLength(512)]
    public required string RefreshToken { get; init; }
}