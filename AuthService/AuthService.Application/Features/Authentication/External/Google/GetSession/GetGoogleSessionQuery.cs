using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.GetSession;

public record GetGoogleSessionQuery(string Token) : IRequest<Result<ExternalLoginResponse>>;