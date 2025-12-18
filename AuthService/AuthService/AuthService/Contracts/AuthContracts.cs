namespace AuthService.Contracts;

public sealed record AuthUser(Guid Id, string Email, string Name, string LastName);

public sealed record UserProfile(
    string Name,
    string LastName,
    string Avatar,
    string Role,
    int? Age
);

public sealed record FamilyContext(
    string? Code,
    string? Name,
    string? Emblem
);

public sealed record AuthResponse(
    string Token,
    AuthUser User,
    UserProfile Profile,
    FamilyContext? Family
);
