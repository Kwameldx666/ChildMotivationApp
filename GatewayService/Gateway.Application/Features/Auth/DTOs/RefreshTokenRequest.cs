namespace Gateway.Application.Features.Auth.DTOs;

public sealed record RefreshTokenRequest
{
    public required string RefreshToken { get; init; }
}