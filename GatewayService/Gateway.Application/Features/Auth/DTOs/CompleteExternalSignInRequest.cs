namespace Gateway.Application.Features.Auth.DTOs;

public record CompleteExternalSignInRequest
{
    public required string PendingToken { get; init; }
    public required string Role { get; init; }
    public required string Name { get; init; }
    public required string LastName { get; init; }
    public string? Email { get; init; }
    public string? Avatar { get; init; }
    public int? Age { get; init; }
    public string? FamilyCode { get; init; }
    public string? FamilyName { get; init; }
    public string? FamilyEmblem { get; init; }
}