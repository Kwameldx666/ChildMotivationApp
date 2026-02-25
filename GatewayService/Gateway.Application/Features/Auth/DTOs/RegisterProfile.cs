namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterProfile(
    string Name,
    string LastName,
    string? Avatar,
    string? Role,
    int? Age
);