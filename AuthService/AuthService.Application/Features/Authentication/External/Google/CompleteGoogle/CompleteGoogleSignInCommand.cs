using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.CompleteGoogle;

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