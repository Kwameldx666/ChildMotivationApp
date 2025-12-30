using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Discord.SignIn;

public record DiscordSignInCommand(string State, string Code) : IRequest<Result<ExternalSignInResult>>;