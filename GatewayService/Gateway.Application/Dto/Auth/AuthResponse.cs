namespace Gateway.Application.Dto.Auth;

public sealed record AuthResponse(string Token, AuthUser User, UserProfile Profile, FamilyContext? Family);