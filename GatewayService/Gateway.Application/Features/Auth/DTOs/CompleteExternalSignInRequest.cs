namespace Gateway.Application.Features.Auth.DTOs;

public record CompleteExternalSignInRequest
{
    public required string Token { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public string? LastName { get; init; }
    public string? AvatarUrl { get; init; }
}