namespace Gateway.Application.Dto.Auth;

public sealed record AuthUser(Guid Id, string Email, string Name, string LastName);