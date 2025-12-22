namespace AuthService.Application.Dto.Auth.Login;

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    AuthUserDto User,
    UserProfileDto Profile,
    FamilyDto? Family,
    string TokenType = "Bearer");