using System.Diagnostics.CodeAnalysis;
using AuthService.Application.Models.Auth.Login;
using AuthService.Application.Models.User;

namespace AuthService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public class ExternalLoginResponse(
    string accessToken,
    string refreshToken,
    AuthUserDto user,
    UserProfileDto profile,
    FamilyDto? family,
    bool mustChangePassword = false,
    string tokenType = "Bearer")
    : LoginResponse(accessToken, refreshToken, tokenType)
{
    public AuthUserDto User { get; init; } = user;
    public UserProfileDto Profile { get; init; } = profile;
    public FamilyDto? Family { get; init; } = family;
    public bool MustChangePassword { get; init; } = mustChangePassword;
}

