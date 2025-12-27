using AuthService.Application.Features.Authentication.External.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.External.Google.GetPendingUser;

public record GetPendingUserQuery(string Token) : IRequest<Result<ExternalPendingUserResponse>>;