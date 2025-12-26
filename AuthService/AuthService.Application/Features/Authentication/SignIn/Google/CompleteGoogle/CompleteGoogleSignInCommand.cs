using AuthService.Application.Dto.Auth.Login;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.CompleteGoogle;

public record CompleteGoogleSignInCommand(
    string PendingToken,
    string Role,
    string Name,
    string LastName,
    string? Avatar,
    int? Age,
    string? FamilyCode,
    string? FamilyName,
    string? FamilyEmblem) : IRequest<Result<ExternalLoginResponse>>;