namespace Gateway.Application.Dto.Auth;

public sealed record UserProfile(string Name, string LastName, string Avatar, string Role, int? Age);

