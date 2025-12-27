using AuthService.Application.Features.Authentication.SignIn.Shared.Dto;
using AuthService.Common.ResultPattern;
using MediatR;

namespace AuthService.Application.Features.Authentication.SignIn.Google.GetPendingUser;

public record GetGooglePendingUserQuery(string Token) : IRequest<Result<ExternalPendingUserResponse>>;