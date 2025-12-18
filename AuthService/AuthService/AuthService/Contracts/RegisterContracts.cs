namespace AuthService.Contracts;

public sealed record RegisterRequest(
    string Email,
    string Password,
    string Role,
    RegisterProfile Profile,
    RegisterFamily? Family
);

public sealed record RegisterProfile(
    string Name,
    string LastName,
    string Avatar,
    string? Role,
    int? Age
);

public sealed record RegisterFamily(
    string? Code,
    string? Name,
    string? Emblem
);
