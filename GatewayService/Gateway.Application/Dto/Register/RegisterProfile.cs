namespace Gateway.Application.Dto.Register;

public record RegisterProfile(
    string Name,
    string LastName,
    string Avatar,
    string? Role,
    int? Age
);