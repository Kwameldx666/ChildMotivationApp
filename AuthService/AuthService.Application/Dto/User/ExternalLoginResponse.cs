using AuthService.Application.Models.Auth.Login;
using AuthService.Application.Models.User;

namespace AuthService.Application.Features.Authentication.External.Shared.Dto;

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