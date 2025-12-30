using AuthService.Application.Dto.User;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Cache.PendingUser;

public record GetPendingUserQuery(string Token) : IRequest<Result<ExternalPendingUserResponse>>;