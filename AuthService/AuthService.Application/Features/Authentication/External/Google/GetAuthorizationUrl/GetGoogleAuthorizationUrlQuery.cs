using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.GetAuthorizationUrl;

public record GetGoogleAuthorizationUrlQuery : IRequest<Result<AuthorizationUrlResponse>>;