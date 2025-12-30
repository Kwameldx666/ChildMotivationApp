namespace Gateway.Application.Dto.Register;

public record AuthServiceRegisterRequest(
    string Email,
    string Password,
    string Role,
    string Name,
    string LastName,
    string? Avatar,
    int? Age,
    string? Code,
    string? FamilyName,
    string? Emblem
);