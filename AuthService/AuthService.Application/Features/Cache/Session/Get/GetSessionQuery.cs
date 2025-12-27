using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.Session.Get;

public record GetSessionQuery(string Token) : IRequest<Result<ExternalLoginResponse>>;