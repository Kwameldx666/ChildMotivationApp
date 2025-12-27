using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.GetAuthorizationUrl;

public record GetGoogleAuthorizationUrlQuery : IRequest<Result<AuthorizationResponse>>;