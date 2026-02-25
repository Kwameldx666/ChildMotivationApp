using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Cache.Session.Get;

public record GetSessionQuery(string Token) : IRequest<Result<ExternalLoginResponse>>;