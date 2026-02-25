using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.GitHub.CompleteSignIn;

public record CompleteGitHubSignInCommand(
    string PendingToken,
    string Role,
    string Name,
    string LastName,
    string? Email,
    string? Avatar,
    int? Age,
    string? FamilyCode,
    string? FamilyName,
    string? FamilyEmblem) : IRequest<Result<ExternalLoginResponse>>;