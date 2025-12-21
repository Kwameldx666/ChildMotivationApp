namespace AuthService.Application.Dto;

public record LoginResponse(
    string Token,
    int ExpiresIn,
    AuthUserDto User,
    UserProfileDto Profile,
    FamilyDto? Family,
    string TokenType = "Bearer");