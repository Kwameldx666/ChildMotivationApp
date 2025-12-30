using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Discord.CompleteSignIn;

public record CompleteDiscordSignInCommand(
    string PendingToken,
    string Role,
    string Name,
    string LastName,
    string? Avatar,
    int? Age,
    string? FamilyCode,
    string? FamilyName,
    string? FamilyEmblem) : IRequest<Result<ExternalLoginResponse>>;