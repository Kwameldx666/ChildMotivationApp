using AuthService.Application.Dto.User;

namespace AuthService.Application.Dto.Auth.Login;

public class LoginResponse(
    string accessToken,
    string refreshToken,
    string tokenType = "Bearer")
{
    public string AccessToken { get; init; } = accessToken;
    public string RefreshToken { get; init; } = refreshToken;
    public string TokenType { get; init; } = tokenType;
}

public class ExternalLoginResponse(
    string accessToken,
    string refreshToken,
    AuthUserDto user,
    UserProfileDto profile,
    FamilyDto? family,
    string tokenType = "Bearer")
    : LoginResponse(accessToken, refreshToken, tokenType)
{
    public AuthUserDto User { get; init; } = user;
    public UserProfileDto Profile { get; init; } = profile;
    public FamilyDto? Family { get; init; } = family;
}