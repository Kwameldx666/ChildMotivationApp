using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Discord.GetAuthorizationUrl;

public record GetDiscordAuthorizationUrlQuery : IRequest<Result<AuthorizationUrlResponse>>;